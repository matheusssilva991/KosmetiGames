# 🎮 KosmetiGames - E-commerce de Produtos de Games

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.19-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

E-commerce especializado em produtos relacionados a games, desenvolvido como projeto da disciplina de Empreendedorismo da UESC (Universidade Estadual de Santa Cruz).

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando a Aplicação](#executando-a-aplicação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API e Rotas](#api-e-rotas)
- [Docker](#docker)
- [Contribuindo](#contribuindo)
- [Autores](#autores)
- [Licença](#licença)

## 🎯 Sobre o Projeto

O **KosmetiGames** é uma plataforma de e-commerce voltada para a venda de produtos relacionados ao universo dos games, incluindo skins, itens cosméticos, DLCs e outros produtos digitais e físicos. O projeto implementa um sistema completo de autenticação, gerenciamento de produtos, carrinho de compras e histórico de compras.

### Principais Características

- Sistema de autenticação seguro com sessões
- Gerenciamento completo de produtos (CRUD)
- Sistema de carrinho de compras
- Filtros por jogos e categorias
- Upload de imagens para produtos
- Histórico de compras do usuário
- Interface responsiva com EJS

## ⚡ Funcionalidades

### Para Usuários

- ✅ Cadastro e autenticação de usuários
- ✅ Navegação por catálogo de produtos
- ✅ Filtros por jogo e categoria
- ✅ Visualização detalhada de produtos
- ✅ Adicionar produtos ao carrinho
- ✅ Finalizar compras
- ✅ Histórico de produtos comprados
- ✅ Edição de perfil

### Para Vendedores

- ✅ Cadastro de produtos com imagens
- ✅ Gerenciamento de produtos próprios (editar/excluir)
- ✅ Visualização de produtos cadastrados
- ✅ Definição de preço, estoque e descrição

## 🚀 Tecnologias Utilizadas

### Backend

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web para Node.js
- **MySQL2** - Driver MySQL para Node.js
- **EJS** - Template engine para renderização de views

### Autenticação e Segurança

- **bcrypt** - Hash de senhas
- **jsonwebtoken** - Geração e validação de tokens JWT
- **express-session** - Gerenciamento de sessões

### Upload e Arquivos

- **Multer** - Middleware para upload de arquivos

### Utilitários

- **dotenv** - Gerenciamento de variáveis de ambiente
- **cors** - Controle de acesso CORS
- **nodemon** - Auto-reload durante desenvolvimento

### DevOps

- **Docker** - Containerização da aplicação
- **Docker Compose** - Orquestração de containers

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 18.x ou superior)
- [MySQL](https://www.mysql.com/) (versão 8.0 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (opcional, mas recomendado)
- [Git](https://git-scm.com/)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/matheusssilva991/KosmetiGames.git
cd KosmetiGames
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

Execute os scripts SQL localizados em `src/database/schemas/`:

```bash
# Criar a estrutura do banco
mysql -u seu_usuario -p < src/database/schemas/schema.sql

# Inserir dados iniciais (jogos e categorias)
mysql -u seu_usuario -p < src/database/schemas/games_and_cateegories_inserts.sql
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Servidor
PORT=8080

# Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=nome_do_banco
DB_PORT=3306

# Segurança
SECRET_KEY=sua_chave_secreta_jwt
SESSION_SECRET=sua_chave_secreta_sessao
```

> **Nota:** Nunca commite o arquivo `.env` no repositório. Mantenha-o no `.gitignore`.

## 🎮 Executando a Aplicação

### Modo Desenvolvimento (Local)

```bash
npm run start
```

A aplicação estará disponível em `http://localhost:8080`

### Modo Produção com Docker

#### Primeira execução (criar containers)

```bash
docker compose up --build
```

#### Iniciar serviços existentes

```bash
docker compose start
```

#### Parar serviços

```bash
docker compose stop
```

#### Parar e remover containers

```bash
docker compose down
```

## 📁 Estrutura do Projeto

```
KosmetiGames/
├── public/                      # Arquivos estáticos
│   ├── css/                     # Estilos CSS
│   │   └── styles.css
│   └── images/                  # Imagens de produtos
├── src/                         # Código fonte
│   ├── controllers/             # Controladores (lógica de rotas)
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   └── user.controller.js
│   ├── database/                # Configuração do banco de dados
│   │   ├── config.js
│   │   ├── connection.js
│   │   └── schemas/             # Scripts SQL
│   │       ├── schema.sql
│   │       └── games_and_cateegories_inserts.sql
│   ├── middlewares/             # Middlewares personalizados
│   │   └── auth.middleware.js
│   ├── models/                  # Modelos de dados
│   │   ├── cart.model.js
│   │   ├── category.model.js
│   │   ├── game.model.js
│   │   ├── product.model.js
│   │   └── user.model.js
│   ├── multer/                  # Configuração de upload
│   │   └── multer.js
│   ├── routes/                  # Definição de rotas
│   │   └── routes.js
│   ├── services/                # Lógica de negócios
│   │   ├── auth.service.js
│   │   ├── cart.service.js
│   │   ├── category.service.js
│   │   ├── game.service.js
│   │   ├── product.service.js
│   │   └── user.service.js
│   ├── views/                   # Templates EJS
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── product/             # Views de produtos
│   │   ├── user/                # Views de usuário
│   │   ├── home.ejs
│   │   └── login.ejs
│   └── index.js                 # Ponto de entrada da aplicação
├── dev_files/                   # Arquivos de desenvolvimento
├── .env                         # Variáveis de ambiente (não versionado)
├── .gitignore                   # Arquivos ignorados pelo Git
├── docker-compose.yml           # Configuração Docker Compose
├── Dockerfile                   # Configuração Docker
├── package.json                 # Dependências e scripts
└── README.md                    # Este arquivo
```

## 🛣️ API e Rotas

### Autenticação

- `GET /login` - Exibe página de login
- `POST /login` - Realiza autenticação
- `GET /logout` - Realiza logout

### Produtos

- `GET /` - Página inicial com listagem de produtos
- `GET /product/:id` - Detalhes de um produto
- `GET /user/:id/product/register` - Formulário de cadastro de produto
- `POST /user/:id/product/register` - Criar novo produto
- `GET /user/:id/product/:product_id/edit` - Formulário de edição
- `POST /user/:id/product/:product_id/edit` - Atualizar produto
- `DELETE /user/:id/product/:product_id` - Excluir produto
- `GET /user/:id/products` - Lista produtos do usuário

### Usuário

- `GET /user/register` - Formulário de cadastro
- `POST /user/register` - Criar novo usuário
- `GET /user/:id` - Visualizar perfil
- `GET /user/:id/edit` - Formulário de edição
- `POST /user/:id/edit` - Atualizar usuário

### Carrinho

- `GET /user/:id/cart` - Visualizar carrinho
- `POST /cart/add` - Adicionar produto ao carrinho
- `POST /cart/remove` - Remover produto do carrinho
- `POST /cart/checkout` - Finalizar compra

## 🐳 Docker

O projeto inclui configuração completa para Docker, facilitando a implantação e desenvolvimento.

### Serviços Configurados

- **app**: Aplicação Node.js
- **db**: Banco de dados MySQL

### Volumes

- `mysql_data`: Persistência dos dados do MySQL
- Bind mount do código fonte para desenvolvimento

### Portas

- `8080`: Aplicação web
- `3306`: MySQL (mapeado localmente)

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 👨‍💻 Autores

- **Matheus Santos Silva** - [GitHub](https://github.com/matheusssilva991)

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais como parte da disciplina de Empreendedorismo da UESC.

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!
