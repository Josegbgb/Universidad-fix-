### 🔍 Explicación visual de lo que significa "encerrar"

| Lo que escribes | ¿Qué hace?                                                                                    |
| :-------------- | :-------------------------------------------------------------------------------------------- |
| ` ```mermaid `  | **Abre** la zona de código Mermaid. Le dice a VS Code: _"Lo que viene ahora es un diagrama"_. |
| `graph LR ...`  | **El código** del diagrama en sí.                                                             |
| ` ``` `         | **Cierra** la zona de código. Le dice a VS Code: _"Terminó el diagrama"_.                     |

### ❌ Lo que NO debes hacer (y probablemente hiciste)

Simplemente pegar el código **sin las líneas de \`\`\`**. Si haces eso, VS Code lo lee como texto normal y la vista previa sale en blanco o con letras sueltas.

### ✅ Instrucción final corregida para VS Code:

1. Abre tu archivo `.md`.
2. Borra todo.
3. Escribe esto literal (copia y pega):

````text
```mermaid
graph LR
    classDef cliente fill:#DBEAFE,stroke:#2563EB,stroke-width:3px,color:#1E3A8A,font-weight:bold,r:10
    classDef servidor fill:#F0FDF4,stroke:#059669,stroke-width:3px,color:#064E3B,font-weight:bold,r:10
    classDef db fill:#F3E8FF,stroke:#7E22CE,stroke-width:3px,color:#4C1D95,font-weight:bold,r:10
    classDef subcaja fill:#FFFFFF,stroke:#9CA3AF,stroke-width:1px,color:#111827,font-weight:normal,stroke-dasharray: 5 5

    subgraph Cliente [Cliente / Frontend (React)]
        direction TB
        UI[Interfaz de Usuario UI]
        Form[Formularios]
        Tab[Tablas]
    end

    subgraph Servidor [Servidor (Node.js + API REST)]
        direction TB
        subgraph API_REST [ ]
            Ruta[Ruta HTTP (Endpoint)]
        end
        Ruta --> Controlador[Controlador]
        Controlador --> Validacion[Validación (Zod)]
        Validacion --> Modelo[Modelo]
        subgraph Modelo_Interno [ ]
            Logica[Lógica de negocio]
            SQL_Interno[Consultas SQL]
        end
    end

    subgraph BD [Base de Datos (SQLite)]
        direction TB
        Persistencia[Persistencia de datos]
        TablasRel[Tablas relacionales]
        Integridad[Integridad referencial]
        ConsultasSQL[Consultas SQL]
    end

    Cliente -->|Solicitudes HTTP<br/>GET, POST, PUT, DELETE| Servidor
    Servidor -->|Consultas SQL| BD
    BD -->|Resultados / Datos| Servidor
    Servidor -->|Respuesta HTTP<br/>JSON + código de estado| Cliente

    class Cliente cliente
    class Servidor servidor
    class BD db
    class API_REST,Ruta,Controlador,Validacion,Modelo,Modelo_Interno subcaja

    style API_REST fill:none,stroke:none
    style Modelo_Interno fill:none,stroke:none
````
