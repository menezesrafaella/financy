# Estrutura de Estilos - Financy

Os estilos foram organizados em uma estrutura modular para melhor manutenção e escalabilidade.

## 📁 Estrutura de Pastas

```
frontend/src/
├── styles.css                    # Arquivo principal (importa todos os outros)
└── styles/
    ├── variables.css             # Variáveis globais de cores e design
    ├── base.css                  # Estilos base e reset
    ├── components/               # Estilos de componentes reutilizáveis
    │   ├── Topbar.css           # Barra de navegação superior
    │   ├── Avatar.css           # Avatar do usuário
    │   ├── Card.css             # Cards e layouts gerais
    │   ├── Transaction.css      # Componentes de transações
    │   ├── Tag.css              # Tags e badges
    │   └── Modal.css            # Modais e diálogos
    └── pages/                    # Estilos específicos de páginas
        ├── Auth.css             # Páginas de Login e Register
        ├── Dashboard.css        # Página do Dashboard
        ├── Profile.css          # Página de Perfil
        ├── Categories.css       # Página de Categorias
        └── Transactions.css     # Página de Transações
```

## 🎯 Benefícios da Nova Estrutura

- **Organização Clara**: Cada arquivo é responsável por uma parte específica
- **Manutenção Facilitada**: Encontre e edite estilos com mais facilidade
- **Reutilização**: Componentes compartilham estilos de forma organizada
- **Escalabilidade**: Fácil adicionar novos componentes ou páginas
- **Performance**: CSS bem organizado e sem duplicação
