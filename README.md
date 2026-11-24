# KosmetiGames

E-commerce de produtos relacionados a games, desenvolvido para a disciplina de Empreendedorismo da UESC. A aplicação usa Node.js 24 LTS, Express, EJS e MySQL 8.0.

O catálogo permite buscar produtos e filtrar por jogo e categoria. Usuários cadastrados podem anunciar produtos, editar o perfil e fazer compras simuladas. A finalização baixa o estoque e registra os dados de cada item no histórico.

## Executar com Docker

1. Copie o arquivo de exemplo e configure as senhas do MySQL e a chave de sessão.

   ```bash
   cp .env.example .env
   openssl rand -hex 32
   ```

   Use a saída do segundo comando em `SESSION_SECRET`.

2. Suba os serviços e abra `http://localhost:8080/products`.

   ```bash
   docker compose up --build -d
   docker compose ps
   ```

   Na primeira inicialização, o MySQL cria as tabelas e cadastra os jogos e as categorias. O volume `db_data` guarda o banco e `product_images` guarda os uploads. A porta local do MySQL é `3307`.

## Executar sem Docker

1. Crie um banco MySQL e conceda a um usuário acesso a ele. Configure `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` e `SESSION_SECRET` no `.env`. Se estiver usando o MySQL do Compose, a porta local padrão é `3307`.

2. Em um banco vazio, importe o esquema e depois as opções do catálogo. No exemplo, o banco é `ecommerce` e o MySQL está na porta `3306`.

   ```bash
   mysql -h 127.0.0.1 -P 3306 -u kosmetigames -p ecommerce < src/database/schemas/schema.sql
   mysql -h 127.0.0.1 -P 3306 -u kosmetigames -p ecommerce < src/database/schemas/seed.sql
   ```

3. Instale as dependências e inicie a aplicação.

   ```bash
   npm ci
   npm start
   ```

   Use `npm run dev` para reiniciar ao editar o código. Os uploads locais ficam em `public/images`. Em HTTPS, use `SESSION_COOKIE_SECURE=true`. Se o HTTPS terminar em um proxy reverso de confiança diretamente à frente da aplicação, configure também `TRUST_PROXY=true`.

## Atualizar um banco existente

1. Pare a aplicação para suspender gravações e faça backup do banco e da pasta de imagens antes de recriar o container. Se o Compose antigo ainda usa o nome `ecommerce-app`, copie as imagens dele, inclusive com o container parado.

   ```bash
   mkdir -p ../kosmetigames-backup
   docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --no-tablespaces "$MYSQL_DATABASE"' > ../kosmetigames-backup/ecommerce.sql
   docker cp ecommerce-app:/app/public/images ../kosmetigames-backup/images
   ```

2. Aplique a migração com a aplicação parada. Em execução local, rode `npm run db:migrate` com o `.env` apontando para o banco existente. Em Docker, use o mesmo projeto do Compose que já contém o volume `db_data`.

   ```bash
   docker compose up -d --wait db
   docker compose run --build --rm app npm run db:migrate
   ```

   A migração preserva os IDs, pode ser reaplicada e informa os registros que exigem revisão, como pedidos sem comprador, quantidades ausentes ou carrinhos abertos duplicados. Os itens de compras anteriores recebem os dados disponíveis no catálogo na data da migração e são identificados como estimativas. A baixa de estoque começa nas próximas finalizações.

3. Se houver imagens do container antigo, copie o backup para o volume antes de iniciar a aplicação nova.

   ```bash
   docker compose run --rm --no-deps -v "$PWD/../kosmetigames-backup/images:/backup:ro" app \
     cp -a --no-preserve=ownership /backup/. /app/public/images/
   docker compose up -d app
   ```

## Rotas

| Método | URL | Uso |
| --- | --- | --- |
| GET | `/products` | Catálogo com filtros `game`, `category` e `search` |
| GET | `/products/:productId` | Detalhes do produto |
| GET / POST | `/register`, `/login` | Cadastro e autenticação |
| POST | `/logout` | Encerra a sessão |
| GET / PATCH | `/account` | Exibe e atualiza o perfil |
| GET | `/account/products` | Lista os produtos próprios |
| GET | `/products/new`, `/products/:productId/edit` | Formulários de cadastro e edição |
| POST | `/products` | Cadastra um produto |
| PATCH / DELETE | `/products/:productId` | Atualiza ou arquiva um produto próprio |
| GET | `/cart` | Exibe o carrinho |
| POST | `/cart/items` | Adiciona `productId` e `quantity` ao carrinho |
| DELETE | `/cart/items/:itemId` | Remove um item do carrinho |
| POST | `/cart/checkout` | Finaliza o carrinho identificado por `orderId` |
| GET | `/account/orders` | Exibe o histórico do comprador |

Os formulários incluem um token CSRF e usam POST com `?_method=PATCH` ou `?_method=DELETE` quando necessário. Os endereços GET antigos de navegação redirecionam para as rotas equivalentes. As páginas da conta, do carrinho e o gerenciamento de produtos exigem sessão.

## Testes

```bash
npm test
```

Para incluir os testes de integração, defina `TEST_MYSQL_URL` com as credenciais de um MySQL 8.0 de testes. O usuário precisa poder criar e remover bancos temporários. A suíte usa nomes próprios e remove apenas os bancos que cria.

```bash
TEST_MYSQL_URL='mysql://usuario:senha@127.0.0.1:3307' npm test
```

## Autoria

Matheus Santos Silva e Igor Sousa. Projeto desenvolvido para fins educacionais na UESC.
