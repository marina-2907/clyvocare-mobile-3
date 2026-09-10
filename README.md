# 🐾 ClyvoCare

Aplicativo mobile desenvolvido para auxiliar tutores no acompanhamento contínuo da saúde e dos cuidados de seus pets.

O ClyvoCare centraliza informações do tutor e dos animais em uma única aplicação, permitindo cadastro de pets, acompanhamento de consultas, histórico clínico, agenda de cuidados, alertas inteligentes e visualização de informações importantes sobre a saúde do animal.

Nesta versão, o aplicativo mobile está integrado a uma **API REST desenvolvida em Java com Spring Boot**, utilizando **Oracle Database** para persistência dos dados.

---

## Sobre o projeto

A proposta do ClyvoCare é facilitar a rotina de cuidados dos tutores e proporcionar uma visão mais organizada sobre a saúde de cada pet.

A aplicação permite que um mesmo tutor possua múltiplos animais cadastrados e acompanhe individualmente informações como consultas, vacinas, exames, tratamentos, peso, dados cadastrais e histórico de saúde.

Além disso, o sistema possui uma área de alertas inteligentes que utiliza regras baseadas nos dados disponíveis para apresentar orientações preventivas ao tutor.

> Os alertas apresentados pelo ClyvoCare possuem caráter informativo e não substituem avaliação ou diagnóstico realizado por um médico-veterinário.

---

# Principais funcionalidades

## Autenticação

O aplicativo possui fluxo de autenticação integrado ao backend.

Funcionalidades disponíveis:

- Cadastro de tutor;
- Login;
- Persistência da sessão;
- Logout;
- Consulta e atualização do perfil autenticado.

A autenticação da API utiliza **JWT (JSON Web Token)**.

---

## Home

A tela inicial apresenta uma visão geral do pet selecionado.

Entre as informações apresentadas estão:

- Pet em destaque;
- Resumo de saúde;
- Informações de peso e idade;
- Situação dos cuidados registrados;
- Próxima consulta;
- Acesso rápido às principais funcionalidades;
- Alertas e recomendações;
- Seleção entre diferentes pets cadastrados pelo tutor.

A Home utiliza os dados disponíveis na aplicação e na API para apresentar informações de forma dinâmica.

---

## Meus Pets

O tutor pode possuir mais de um pet cadastrado.

A tela permite:

- Visualizar todos os pets do tutor;
- Selecionar o pet que será utilizado nas demais telas;
- Consultar informações do animal;
- Editar seus dados;
- Excluir um pet;
- Cadastrar novos pets.

---

## Cadastro de Pet

O cadastro de pets possui formulário completo com informações como:

- Nome;
- Espécie;
- Sexo;
- Data de nascimento;
- Opção para nascimento desconhecido;
- Peso atual;
- Porte;
- Informações adicionais.

As espécies disponíveis são carregadas através da API.

Após o cadastro, os dados são persistidos no Oracle e a listagem de pets é atualizada automaticamente.

---

## Agenda

A Agenda permite acompanhar os compromissos relacionados aos cuidados do pet.

O sistema apresenta consultas futuras e utiliza a data atual para indicar quando uma consulta está se aproximando.

São exibidas informações como:

- Data;
- Horário;
- Tipo de atendimento;
- Profissional;
- Clínica;
- Observações;
- Situação da consulta.

A aplicação diferencia consultas futuras, consultas do dia e registros anteriores.

---

## Histórico de Saúde

O histórico organiza informações clínicas relacionadas ao pet.

Podem ser acompanhados registros como:

- Consultas;
- Vacinas;
- Exames;
- Tratamentos;
- Prescrições;
- Outras informações clínicas disponibilizadas pela API.

Cada registro é associado ao pet selecionado, permitindo consultar sua trajetória de cuidados de maneira individual.

---

## Clyvo IA

O ClyvoCare possui uma área de inteligência de apoio ao tutor.

Nesta versão, o componente utiliza **regras determinísticas e análise dos dados disponíveis no sistema** para gerar insights e alertas preventivos.

Os alertas podem levar em consideração informações como:

- Idade;
- Peso;
- Agenda;
- Histórico;
- Vacinas;
- Cuidados registrados;
- Informações disponíveis sobre o animal.

A proposta é apoiar a organização e priorização dos cuidados sem realizar diagnóstico veterinário.

---

## Perfil do Tutor

A área de perfil utiliza os dados do usuário autenticado.

O tutor pode:

- Consultar seus dados;
- Atualizar informações pessoais;
- Visualizar informações associadas à conta;
- Sair da aplicação.

---

# Arquitetura da solução

A versão atual utiliza a seguinte arquitetura:

```text
┌───────────────────────────────┐
│         ClyvoCare Mobile      │
│ React Native + Expo + TS      │
└──────────────┬────────────────┘
               │
               │ HTTP / REST + JWT
               ▼
┌───────────────────────────────┐
│        API Java Spring        │
│      Spring Boot / JPA        │
└──────────────┬────────────────┘
               │
               │ JDBC / Hibernate
               ▼
┌───────────────────────────────┐
│        Oracle Database        │
│         FIAP - ORCL           │
└───────────────────────────────┘
```

O mobile não acessa o banco diretamente.

Toda comunicação com os dados persistidos ocorre através da API REST.

---

# Tecnologias utilizadas

### Mobile

- React Native
- Expo
- TypeScript
- React Navigation
- TanStack React Query
- AsyncStorage
- Expo Vector Icons

### Backend

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security
- JWT
- Gradle
- Flyway

### Banco de Dados

- Oracle Database
- Oracle FIAP ORCL

---

# Estrutura principal

```text
challenge12-clyvocare/
│
├── assets/
│   └── images/
│
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── backend-java/
│   ├── gradle/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   │       └── db/migration/
│   │   └── test/
│   ├── build.gradle
│   ├── gradlew
│   └── gradlew.bat
│
├── App.tsx
├── app.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# Integração Mobile + API

A aplicação utiliza uma camada de serviços responsável pela comunicação com o backend.

Entre os principais serviços estão:

```text
src/services/
├── api.ts
├── authService.ts
├── clinicalService.ts
├── localCareService.ts
├── ownerService.ts
└── petService.ts
```

A URL da API pode ser configurada através da variável:

```text
EXPO_PUBLIC_API_URL
```

No emulador Android, a aplicação pode utilizar:

```text
http://10.0.2.2:8080
```

O endereço `10.0.2.2` permite que o emulador Android acesse o `localhost` da máquina hospedeira.

---

# Como executar o projeto

## 1. Pré-requisitos

É necessário possuir:

- Git;
- Node.js;
- npm;
- Java;
- Android Studio;
- Emulador Android;
- Acesso ao Oracle FIAP, quando necessário para executar o backend.

---

## 2. Clonar o repositório

```bash
git clone https://github.com/2TDSPX/challenge12-clyvocare.git
```

Acesse a pasta:

```bash
cd challenge12-clyvocare
```

---

# Executando o Backend

Acesse:

```bash
cd backend-java
```

No Windows PowerShell, configure as variáveis de ambiente:

```powershell
$env:DB_USERNAME="SEU_USUARIO_ORACLE"
$env:DB_PASSWORD="SUA_SENHA_ORACLE"
$env:JWT_SECRET="SUA_CHAVE_JWT_COM_PELO_MENOS_64_CARACTERES"
```

As credenciais **não são armazenadas no repositório**.

O arquivo `application.properties` utiliza:

```properties
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
app.jwt.secret=${JWT_SECRET}
```

### Banco compartilhado utilizado na demonstração

Como o schema Oracle utilizado durante o desenvolvimento é compartilhado e já possui histórico de migrations, para executar a versão utilizando esse banco pode ser necessário desativar o Flyway na sessão:

```powershell
$env:SPRING_FLYWAY_ENABLED="false"
```

Depois execute:

```powershell
.\gradlew.bat bootRun
```

A API será iniciada por padrão em:

```text
http://localhost:8080
```

---

# Executando o Mobile

Abra outro terminal e volte para a raiz do projeto:

```powershell
cd C:\caminho\para\challenge12-clyvocare
```

Instale as dependências:

```bash
npm ci
```

Inicie o Expo:

```bash
npx expo start -c
```

Para executar no emulador Android, pressione:

```text
a
```

---

# Testes e validações

Antes da entrega, o projeto foi validado utilizando:

### Mobile

```bash
npx expo-doctor
npx tsc --noEmit
```

O projeto mobile passou nas validações do Expo Doctor e na compilação TypeScript sem erros.

### Backend

```powershell
$env:SPRING_FLYWAY_ENABLED="false"
.\gradlew.bat clean test
```

Resultado obtido:

```text
BUILD SUCCESSFUL
```

---

# Persistência

A aplicação utiliza Oracle Database para persistência das principais entidades.

O backend possui entidades e endpoints relacionados a:

- Usuários;
- Tutores;
- Pets;
- Espécies;
- Cidades;
- Clínicas;
- Veterinários;
- Consultas;
- Vacinas;
- Exames;
- Tratamentos;
- Prescrições;
- Lembretes;
- Catálogo de serviços.

O mobile utiliza AsyncStorage apenas quando necessário para informações locais da aplicação e gerenciamento da sessão, enquanto os dados principais são obtidos e persistidos através da API.

---

# Segurança

A API utiliza Spring Security e autenticação JWT.

Rotas protegidas exigem token válido enviado pelo aplicativo.

Informações sensíveis como credenciais do banco de dados e segredo JWT são configuradas através de variáveis de ambiente e não ficam armazenadas diretamente no código-fonte.

---

# 🎥 Demonstração em vídeo

Vídeo final da aplicação:

https://youtu.be/wZORlbeUca0

O vídeo demonstra o funcionamento da versão integrada do **ClyvoCare**, incluindo:

- Execução do aplicativo mobile;
- Login e autenticação do tutor;
- Navegação pela Home;
- Gerenciamento de múltiplos pets;
- Cadastro e edição de pets;
- Integração do mobile com a API REST;
- Persistência dos dados no Oracle Database;
- Agenda de consultas e cuidados;
- Histórico de saúde;
- Clyvo IA e alertas inteligentes;
- Perfil do tutor;
- Integração entre React Native, API Java Spring Boot e banco Oracle.

---

# Integrantes

**Felipe Maglio Filho**  
RM 563512

**João Pedro Bitencourt Goldoni**  
RM 564339

**Marina Tamagnini Magalhães**  
RM 561786

**Mateus Granja dos Santos**  
RM 564930

**Vitória Valentina Maglio**  
RM 563509

---

# Status do Projeto

**Versão integrada Mobile + API Java + Oracle concluída e validada para entrega.**

Projeto acadêmico desenvolvido para a FIAP.
