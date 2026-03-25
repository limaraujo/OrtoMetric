# OrtoMetric - Arquitetura e Fluxo

Este documento descreve a arquitetura atual do frontend e backend, com foco no fluxo de autenticacao e medicao.

---

## 1. Fluxo de entrada da aplicacao

```text
index.html
  -> main.tsx
  -> App.tsx (router)
      -> /login -> AuthContainer
      -> /      -> Interface
```

Resumo:

- `AuthContainer` orquestra login/cadastro.
- `Interface` orquestra medicao e canvas.

---

## 2. Visao geral por camadas

```mermaid
flowchart TB
    subgraph Entry
        A[index.html] --> B[main.tsx]
        B --> C[App.tsx Router]
        C --> D1[AuthContainer]
        C --> D2[Interface]
    end

    subgraph AuthPage["AuthContainer"]
        D1 --> AF[AuthForm]
        AF --> AS[AuthSwitch]
        AF --> IF[InputField]
        D1 --> API[lib/api.ts]
    end

    subgraph MeasurePage["Interface"]
        D2 --> H1[useMeasurement]
        D2 --> H2[useImageCanvas]
        H1 --> state1[points, measurements, activeTool, isDragging]
        H2 --> state2[image, transform, isPanning]
    end

    subgraph UI["Componentes de UI"]
        T[Toolbar]
        CB[CanvasBoard]
        RS[ResultsSidebar]
        HD[Header]
    end

    D2 --> HD
    D2 --> T
    D2 --> CB
    D2 --> RS

    state1 --> T
    state1 --> CB
    state1 --> RS
    state2 --> T
    state2 --> CB

    T -->|callbacks| H1
    T -->|callbacks| H2
    CB -->|callbacks| H1
    CB -->|callbacks| H2
```

---

## 3. Fluxo de autenticacao (frontend -> backend)

```text
Usuario envia formulario (AuthForm)
    -> AuthContainer valida campos locais
    -> POST /auth/register (se modo cadastro)
    -> POST /auth/login
    -> salva access_token em sessionStorage
    -> redireciona para /
```

Backend:

```text
routes/auth.py
    -> schemas/user_schema.py (validacao)
    -> services/user_service.py (regra de negocio)
    -> models/user.py (persistencia)
```

Erros:

- 400 payload invalido
- 401 credenciais invalidas
- 500 erro interno

Logs:

- `register_success`
- `register_failed`
- `login_success`
- `login_failed`

---

## 4. Fluxo de medicao

### 4.1 Carregar imagem

```mermaid
sequenceDiagram
    participant U as Usuário
    participant CB as CanvasBoard
    participant IL as ImageLoader
    participant IC as useImageCanvas

    U->>CB: Drop arquivo ou clica "Selecionar"
    CB->>IL: ref.current.open() → input.click()
    U->>IL: Escolhe arquivo
    IL->>CB: onPick(file)
    CB->>IC: onLoadImage(file) = loadImage(file)
    IC->>IC: FileReader.readAsDataURL(file)
    IC->>IC: setImage(dataURL)
    Note over IC: image !== null
    CB->>CB: Re-render: mostra ImagePreview + MeasurementCanvas
```

**Arquivos:** `CanvasBoard.tsx` (drop/click → `onLoadImage`), `ImageLoader.tsx` (input file), `useImageCanvas.ts` (`loadImage` → `setImage`).

---

### 4.2 Pan (arrastar a imagem com o mouse)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant CB as CanvasBoard
    participant IC as useImageCanvas

    U->>CB: MouseDown (ferramenta pan ou botão do meio)
    CB->>IC: onStartPan(e) = startPan(e)
    IC->>IC: setIsPanning(true), setPanStart({x,y})

    loop Enquanto arrasta
        U->>CB: MouseMove
        CB->>IC: onUpdatePan(e) = updatePan(e)
        IC->>IC: delta = e.client - panStart
        IC->>IC: setTransform(panX += deltaX/zoom, panY += deltaY/zoom)
        IC->>IC: setPanStart(atual)
    end

    U->>CB: MouseUp / MouseLeave
    CB->>IC: onEndPan() = endPan()
    IC->>IC: setIsPanning(false)
```

**Observação:** `updatePan` só age se `!isDragging` (passado pelo useImageCanvas); assim, arrastar um ponto de medição não move a imagem.

---

### 4.3 Zoom (roda do mouse)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant CB as CanvasBoard
    participant IC as useImageCanvas

    U->>CB: Wheel
    CB->>IC: onWheelZoom(e) = handleWheelZoom(e)
    IC->>IC: e.preventDefault(), rect = getBoundingClientRect()
    IC->>IC: factor = deltaY < 0 ? 1.1 : 0.9
    IC->>IC: zoomAt(transform.zoom * factor, e.clientX, e.clientY, rect)
    IC->>IC: setTransform(zoom', panX', panY')  ← ancorado no ponto do mouse
```

**Fórmula de ancoragem:** o ponto sob o mouse permanece fixo:  
`pan' = pan + (local - center) * (zoomAtual - zoomNovo)`.

---

### 4.4 Zoom por pinch (toque com dois dedos)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant CB as CanvasBoard
    participant IC as useImageCanvas

    U->>CB: TouchStart (2 dedos)
    CB->>IC: onTouchStartZoom = handleTouchStart
    IC->>IC: e.preventDefault()
    IC->>IC: pinchStartRef = { distance, zoom, centerX, centerY }  ← centro FIXO do gesto

    loop Enquanto move os 2 dedos
        U->>CB: TouchMove (2 dedos)
        CB->>IC: onTouchMoveZoom = handleTouchMove
        IC->>IC: e.preventDefault()
        IC->>IC: scaleFactor = distânciaAtual / distânciaInicial
        IC->>IC: zoomAt(zoomInicial * scaleFactor, centerX, centerY, rect)  ← mesmo centro
        IC->>IC: setTransform(zoom', panX', panY')
    end

    U->>CB: TouchEnd
    CB->>IC: onTouchEndZoom = handleTouchEnd
    IC->>IC: pinchStartRef = null
```

**Detalhe:** o centro usado em `zoomAt` é o **centro inicial** do pinch (guardado em `pinchStartRef`), não o centro atual entre os dedos, para a imagem não “deslizar” durante o gesto.

---

### 4.5 Medicao de Cobb (4 pontos -> angulo)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant CB as CanvasBoard
    participant MC as MeasurementCanvas
    participant UM as useMeasurement

    Note over U,UM: Ferramenta Cobb ativa (Toolbar)

    loop Para cada um dos 4 pontos (P1 a P4)
        U->>MC: Clique na imagem
        MC->>MC: getCanvasCoordinates(e) → (x, y) mundo
        MC->>MC: findPointAtPosition(x,y) → null (não clicou em ponto)
        MC->>UM: onAddPoint(x, y) = addPoint(x, y)
        UM->>UM: newPoint = {x, y, id}
        UM->>UM: setState(points = [...points, newPoint])
        UM->>UM: saveHistory(add_point)
    end

    Note over UM: points.length === 4
    UM->>UM: Ordena P1-P2 (linha superior) e P3-P4 (linha inferior) esq→dir
    UM->>UM: calculateAngle(P1,P2,P3,P4) → ângulo em graus
    UM->>UM: CobbMeasurement = { upperLine, lowerLine, angle, timestamp }
    UM->>UM: setState(points=[], measurements=[...m, nova], activeTool='none')
    UM->>UM: saveHistory(add_measurement)
```

**Desenho:** `MeasurementCanvas` desenha os pontos e segmentos em um `<canvas>`; as coordenadas são convertidas com a mesma transformação (zoom, pan) da imagem. O estado (pontos e medições) vem de `useMeasurement`; o canvas só chama `onAddPoint` / `onMovePoint` / `onStartDrag` / `onEndDrag`.

---

### 4.6 Arrastar ponto de medicao

```mermaid
sequenceDiagram
    participant U as Usuário
    participant MC as MeasurementCanvas
    participant UM as useMeasurement

    U->>MC: MouseDown em cima de um ponto
    MC->>MC: findPointAtPosition(x,y) → pointId
    MC->>MC: setDraggedPoint(pointId)
    MC->>UM: onStartDrag(pointId) = startDrag(pointId)
    UM->>UM: setState(isDragging=true, draggedPointId=pointId)

    loop Enquanto arrasta
        U->>MC: MouseMove
        MC->>MC: getCanvasCoordinates(e)
        MC->>UM: onMovePoint(draggedPoint, x, y) = movePoint(id, x, y)
        UM->>UM: Atualiza ponto em state.points ou em state.measurements
        UM->>UM: Se for medição, recalcula angle com calculateAngle
    end

    U->>MC: MouseUp / MouseLeave
    MC->>MC: setDraggedPoint(null)
    MC->>UM: onEndDrag() = endDrag()
    UM->>UM: saveHistory(move_point), setState(isDragging=false, draggedPointId=null)
```

---

### 4.7 Undo / Redo

```mermaid
flowchart LR
    subgraph useMeasurement
        state[state]
        historyRef[historyRef: HistoryAction[]]
        historyIndexRef[historyIndexRef]
    end

    addPoint --> saveHistory
    addPoint --> setState
    movePoint --> setState
    endDrag --> saveHistory
    clearAll --> saveHistory

    undo --> historyIndexRef
    undo --> setState
    redo --> historyIndexRef
    redo --> setState

    saveHistory --> historyRef
    saveHistory --> historyIndexRef
```

- **Undo:** `historyIndexRef--`; aplica `action.previousState` em `setState`.
- **Redo:** `historyIndexRef++`; reaplica a ação (add_point, add_measurement, clear_all) em cima do estado atual.
- **Histórico:** cada `HistoryAction` guarda `type`, `payload` e `previousState` (snapshot antes da ação).

---

## 5. Onde cada coisa vive

| Item | Onde |
|------|------|
| Estado de auth (modo/formulario/erros) | `pages/AuthContainer.tsx` |
| Formulario de auth | `components/AuthForm.tsx` |
| Switch login/cadastro | `components/ui/AuthSwitch.tsx` |
| Campo reutilizavel | `components/ui/InputField.tsx` |
| Cliente HTTP com token | `lib/api.ts` |
| Pontos atuais (0–4) e medições de Cobb | `useMeasurement` → `state.points`, `state.measurements` |
| Ferramenta ativa, isDragging, draggedPointId | `useMeasurement` → `state` |
| Imagem (data URL) | `useImageCanvas` → `image` |
| Zoom, pan, brilho, contraste, invert | `useImageCanvas` → `transform` |
| isPanning, panStart | `useImageCanvas` |
| Pinch (distância/zoom/centro iniciais) | `useImageCanvas` → `pinchStartRef` |
| Histórico undo/redo | `useMeasurement` → `historyRef`, `historyIndexRef` |
| Desenho dos pontos/linhas/ângulos | `MeasurementCanvas` (canvas 2D, lê points/measurements via props) |
| Conversão tela ↔ mundo | `MeasurementCanvas` → `getCanvasCoordinates`, `toScreen` (no useEffect de desenho) |

---

## 6. Resumo do fluxo de dados

```text
Usuário → CanvasBoard / Toolbar / MeasurementCanvas
    → callbacks (onAddPoint, loadImage, startPan, …)
    → useMeasurement / useImageCanvas
    → setState / setTransform
    → re-render
    → novos props para os mesmos componentes
```

No auth, o mesmo principio vale: `AuthContainer` concentra estado e os componentes de UI apenas recebem props.
