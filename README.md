# 🐾 ClyvoCare OS — Mobile | Sprint 4

### Challenge FIAP 2026 — Entrega Final

Aplicativo mobile desenvolvido para auxiliar tutores no acompanhamento contínuo da saúde e dos cuidados veterinários de seus animais de estimação.

**Versão:** 1.0.0  
**Plataforma:** Android  
**Instituição:** FIAP — Análise e Desenvolvimento de Sistemas  
**Repositório:** [marina-2907/clyvocare-mobile-4](https://github.com/marina-2907/clyvocare-mobile-4)  
**Branch principal:** `feat/sprint4-release`

> **Aviso:** As orientações e os alertas do ClyvoCare possuem caráter informativo e não substituem a avaliação ou o diagnóstico de um médico-veterinário.

---

## 1. Sobre o projeto

O **ClyvoCare OS** é uma solução digital desenvolvida para facilitar a organização e a continuidade dos cuidados veterinários.

A aplicação permite que tutores centralizem informações de seus animais em uma única plataforma, incluindo cadastro, consultas, histórico clínico, acompanhamento preventivo e alertas.

O projeto integra três camadas principais:

- **Aplicativo Mobile:** React Native, Expo e TypeScript.
- **Backend:** API REST desenvolvida em Java com Spring Boot.
- **Banco de Dados:** Oracle Database, responsável pela persistência dos dados.

Nesta Sprint 4, o desenvolvimento foi direcionado à consolidação da integração entre essas tecnologias, implementação de notificações locais, versionamento, hospedagem da API e distribuição do aplicativo Android.

O módulo **Clyvo IA** utiliza regras determinísticas e informações disponíveis no sistema para apresentar orientações preventivas. Não realiza diagnósticos veterinários nem representa uma integração comprovada com um modelo de IA generativa.

---

## 2. Funcionalidades implementadas

| Módulo | Funcionalidades |
|---|---|
| Autenticação | Cadastro de tutores, login JWT, persistência de sessão e logout |
| Home | Resumo das informações do pet selecionado e atalhos para cuidados |
| Meus Pets | Listagem, cadastro, edição, seleção e exclusão de pets |
| Cadastro de Pets | Espécies consultadas pela API, identificação do animal e informações cadastrais |
| Agenda | Agendamento, consulta e acompanhamento de compromissos veterinários |
| Histórico Clínico | Informações relacionadas a consultas, vacinas, exames e tratamentos |
| Clyvo IA / Alertas | Orientações preventivas baseadas em regras e dados do sistema |
| Perfil | Consulta e edição das informações do tutor |
| Sobre o App | Identificação da versão e do commit utilizado na compilação |
| Notificações | Lembretes Android de consultas e navegação para a Agenda |

### 2.1. Destaques da Sprint 4 — Notificações locais

Foi implementada a integração com a biblioteca `expo-notifications` para oferecer lembretes automáticos de consultas veterinárias.

**Fluxo implementado:**

1. O tutor realiza o agendamento de uma consulta.
2. Os dados são enviados à API Java.
3. A consulta é registrada no banco Oracle.
4. O aplicativo identifica a data e o horário do atendimento.
5. Um lembrete local é programado para **uma hora antes da consulta**.
6. O Android apresenta a notificação com o nome do pet e o horário do compromisso.
7. Ao tocar na notificação, o usuário é direcionado para a aba **Agenda**.

A implementação inclui:

- Solicitação das permissões necessárias do Android.
- Configuração do canal de notificações `consultas`.
- Permissão `SCHEDULE_EXACT_ALARM` para agendamento de alarmes exatos.
- Verificação de datas e horários.
- Registro e confirmação de notificações agendadas.
- Tratamento de falhas sem desfazer consultas já salvas.
- Navegação para a Agenda após o toque na notificação.

**Resultado da validação:** O recebimento da notificação foi confirmado no emulador Android. Também foi testada com sucesso a abertura da Agenda ao tocar no lembrete.

---

## 3. Arquitetura da solução

```text
┌───────────────────────────────────────┐
│          ClyvoCare OS Mobile          │
│    React Native + Expo + TypeScript   │
└───────────────────────────────────────┘
                    │
                    │ HTTPS / REST
                    │ Autenticação JWT
                    ▼
┌───────────────────────────────────────┐
│          API Java Spring Boot         │
│       Spring Security + Spring JPA    │
│          Hospedagem: Render           │
└───────────────────────────────────────┘
                    │
                    │ JDBC / Hibernate
                    ▼
┌───────────────────────────────────────┐
│            Oracle Database            │
│             Ambiente FIAP             │
└───────────────────────────────────────┘
```

O aplicativo mobile não realiza conexão direta com o Oracle. Toda comunicação com o banco é intermediada pela API REST.

### 3.1. Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Mobile | React Native, Expo SDK 54, TypeScript |
| Navegação | React Navigation |
| Requisições e cache | TanStack React Query |
| Armazenamento local | AsyncStorage |
| Notificações | Expo Notifications |
| Backend | Java 25, Spring Boot, Spring Web |
| Segurança | Spring Security, JWT |
| Persistência | Spring Data JPA, Hibernate |
| Banco de Dados | Oracle Database |
| Migrações | Flyway |
| Build Java | Gradle |
| Build Android | EAS Build |
| Hospedagem da API | Render |
| Distribuição do APK | Firebase App Distribution |
| Versionamento | Git e GitHub |

---

## 4. Organização do repositório

```text
clyvocare-mobile-4/
│
├── assets/
│
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   │   ├── useClinical.ts
│   │   └── usePets.ts
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   │   ├── api.ts
│   │   ├── clinicalService.ts
│   │   └── notificationService.ts
│   ├── types/
│   └── utils/
│
├── backend-java/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   ├── Dockerfile
│   ├── build.gradle
│   ├── gradlew
│   └── gradlew.bat
│
├── App.tsx
├── app.json
├── eas.json
├── package.json
├── package-lock.json
└── README.md
```

---

## 5. Instalação e execução local

### 5.1. Pré-requisitos

Para executar o projeto localmente, são necessários:

- Git
- Node.js e npm
- Android Studio e Android SDK
- Emulador Android configurado
- JDK compatível com o ambiente Android
- Java 25 para o backend Spring Boot
- Acesso autorizado ao Oracle Database da FIAP

### 5.2. Clonar o repositório

```powershell
git clone -b feat/sprint4-release https://github.com/marina-2907/clyvocare-mobile-4.git

cd clyvocare-mobile-4

npm ci
```

### 5.3. Executar o backend Java

Em um terminal separado:

```powershell
cd backend-java

$env:DB_USERNAME="SEU_USUARIO_ORACLE"
$env:DB_PASSWORD="SUA_SENHA_ORACLE"
$env:JWT_SECRET="SUA_CHAVE_JWT_SEGURA"

.\gradlew.bat bootRun
```

Para ambientes de demonstração em que as migrações já foram aplicadas e a execução do Flyway deve ser desabilitada, pode ser utilizada a configuração:

```powershell
$env:SPRING_FLYWAY_ENABLED="false"
```

Nesse caso, defina a variável antes de executar o backend.

O serviço local utiliza:

`http://localhost:8080`

**Importante:** As credenciais Oracle e o segredo JWT são fornecidos por variáveis de ambiente. Esses valores não devem ser publicados no repositório.

### 5.4. Executar o aplicativo Android

Na raiz do projeto:

```powershell
npm ci

npx expo run:android
```

O comando compila e instala o aplicativo no emulador Android.

Para executar o Metro Bundler com uma development build já instalada:

```powershell
npx expo start --dev-client
```

### 5.5. Configuração da API

O aplicativo utiliza a variável:

`EXPO_PUBLIC_API_URL`

Para testes locais no emulador Android, na ausência dessa variável, o aplicativo utiliza:

`http://10.0.2.2:8080`

Esse endereço permite que o emulador acesse o backend executado no computador.

**Para distribuição externa**, o APK foi compilado com a API pública:

`https://clyvocare-api.onrender.com`

Assim, a versão distribuída pode realizar requisições sem depender do servidor local do desenvolvedor, desde que a API e o banco estejam disponíveis.

---

## 6. Testes e validações

Durante o desenvolvimento e a preparação da entrega, foram realizados testes funcionais e verificações técnicas do aplicativo.

### 6.1. Testes funcionais

| Funcionalidade | Resultado observado |
|---|---|
| Autenticação de usuário | Login realizado com sucesso |
| Autenticação na API pública | Login com perfil `OWNER` confirmado |
| Cadastro de pets | Cadastro testado |
| Listagem de pets | Testada durante a utilização do aplicativo |
| Agenda | Acesso e agendamento de consultas testados |
| Persistência de consultas | Fluxo integrado à API e ao Oracle testado |
| Permissões Android | Autorizadas no emulador |
| Agendamento de notificação | Confirmado pelo Expo |
| Recebimento de notificação | Confirmado no Android |
| Toque na notificação | Abertura da aba Agenda confirmada |
| Build Android | APK gerado e instalado |
| Distribuição | Lançamento cadastrado no Firebase App Distribution |

### 6.2. Validação TypeScript

Foi executado o comando:

```powershell
npx tsc --noEmit
```

**Resultado observado:** execução concluída sem erros de TypeScript nas validações realizadas.

### 6.3. Testes do backend Java

O projeto contém estrutura de testes Java no backend, que pode ser executada com:

```powershell
cd backend-java

.\gradlew.bat test
```

A quantidade de testes e seus resultados devem ser comprovados pelo relatório de execução do Gradle. Não é atribuída uma aprovação automática a testes que não tenham sido executados e documentados.

### 6.4. Teste da API hospedada

A API foi publicada no Render e testada por meio do endpoint:

[GET /api/cities](https://clyvocare-api.onrender.com/api/cities)

Foi observada uma resposta HTTP `200 OK`, com corpo `[]`, correspondente a uma lista vazia de cidades.

O endpoint de autenticação também foi testado por requisição HTTP, com retorno de login bem-sucedido para usuário do perfil `OWNER`.

### 6.5. Evidência de notificações

No emulador Android, foi testado o fluxo completo de lembretes de consultas:

- Consulta registrada com data e horário futuros.
- Notificação agendada para uma hora antes.
- Confirmação do identificador de agendamento.
- Recebimento do aviso no Android.
- Exibição do nome do pet e do horário.
- Navegação para a Agenda ao tocar na notificação.

Esses testes foram realizados com o aplicativo instalado no emulador Android.

---

## 7. Persistência, autenticação e segurança

O backend concentra as informações relacionadas a:

- Tutores e usuários autenticados.
- Animais de estimação.
- Espécies e dados cadastrais.
- Consultas veterinárias.
- Exames e tratamentos.
- Vacinações.
- Histórico e lembretes.

### Autenticação JWT

O acesso às rotas protegidas utiliza autenticação baseada em JWT.

O backend aplica regras de autorização para os diferentes perfis de usuário, incluindo tutores e profissionais.

As credenciais de acesso ao Oracle e o segredo de assinatura JWT são configurados por variáveis de ambiente.

### Persistência Oracle

A API utiliza Spring Data JPA e Hibernate para realizar operações de persistência no Oracle Database.

O aplicativo não precisa armazenar diretamente as credenciais do banco, pois a comunicação com o Oracle ocorre exclusivamente pelo backend.

### Considerações de segurança

- Credenciais não devem ser publicadas no GitHub.
- Tokens e senhas não devem aparecer em vídeos demonstrativos.
- O aplicativo utiliza HTTPS na comunicação com a API pública.
- A rota raiz do backend não foi configurada como uma página web pública.
- A hospedagem gratuita do Render pode apresentar inicialização mais lenta após períodos de inatividade.

---

## 8. Publicação e evidências — Sprint 4

A entrega da Sprint 4 foi preparada utilizando ferramentas de versionamento, compilação, hospedagem e distribuição.

O backend Java foi disponibilizado na plataforma Render, enquanto o APK Android foi gerado por meio do EAS Build e distribuído pelo Firebase App Distribution.

### 8.1. Links oficiais da entrega

| Entregável | Link |
|---|---|
| **GitHub — Repositório final** | [ClyvoCare OS — Sprint 4](https://github.com/marina-2907/clyvocare-mobile-4/tree/feat/sprint4-release) |
| **Vídeo final — YouTube** | [Apresentação da Sprint 4](https://youtu.be/gz9HC7dxdnA) |
| **API Java — Render** | [Endpoint público de teste](https://clyvocare-api.onrender.com/api/cities) |
| **API — URL base** | [clyvocare-api.onrender.com](https://clyvocare-api.onrender.com) |
| **APK Android — EAS Build** | [Baixar e instalar o APK](https://expo.dev/accounts/marina_2901/projects/clyvocare-mobile/builds/36c84caa-79ce-4bfd-98d1-4d4f91b24bb7) |
| **Firebase App Distribution** | APK 1.0.0 distribuído para três testadores convidados |
| **Commit utilizado no APK** | `bf65ef788a7d2728272a0afb6ef1cffd4c81858f` |

### 8.2. APK Android

A versão de distribuição foi compilada utilizando o perfil `preview` do EAS Build.

**Configurações do build:**

```text
Aplicativo: ClyvoCare OS
Versão: 1.0.0
Plataforma: Android
Formato: APK

API:
https://clyvocare-api.onrender.com

Commit:
bf65ef788a7d2728272a0afb6ef1cffd4c81858f
```

O identificador do commit foi incorporado ao APK por meio da variável:

`EXPO_PUBLIC_GIT_COMMIT_SHA`

Esse valor é exibido na tela **Sobre o App**, permitindo identificar a versão de código utilizada na compilação.

**Observação:** commits posteriores que modificam apenas a documentação do repositório não alteram o APK já compilado.

### 8.3. Firebase App Distribution

O APK foi disponibilizado no Firebase App Distribution para os testadores cadastrados na entrega.

No registro da distribuição, constavam:

- **Versão:** 1.0.0.
- **Testadores convidados:** 3.
- **Convites aceitos no momento da verificação:** 0.
- **Downloads concluídos no momento da verificação:** 0.

Os testadores convidados precisam aceitar o convite para instalar a aplicação. A distribuição do arquivo não implica aceitação automática.

### 8.4. Vídeo de apresentação

O vídeo da entrega demonstra o projeto ClyvoCare OS e suas principais funcionalidades.

**Vídeo final da Sprint 4:**

[▶ Assistir à apresentação no YouTube](https://youtu.be/gz9HC7dxdnA)

### 8.5. Demonstração anterior

Também está disponível um vídeo anterior sobre a integração entre aplicativo mobile, API Java e Oracle:

[Apresentação da integração Mobile + Java + Oracle](https://youtu.be/wZORlbeUca0)

A referência principal para esta entrega é o **vídeo final da Sprint 4**.

---

## 9. Equipe de desenvolvimento

| Integrante | RM |
|---|---|
| Felipe Maglio Filho | 563512 |
| João Pedro Bitencourt Goldoni | 564339 |
| Marina Tamagnini Magalhães | 561786 |
| Mateus Granja dos Santos | 564930 |
| Vitória Valentina Maglio | 563509 |

**Instituição:** FIAP  
**Curso:** Análise e Desenvolvimento de Sistemas  
**Projeto:** ClyvoCare OS  
**Entrega:** Sprint 4 — 2026

---

## 10. Considerações finais

A Sprint 4 representa a consolidação da integração mobile do ClyvoCare OS, reunindo desenvolvimento de interfaces, autenticação, comunicação com API REST, persistência Oracle, notificações Android e ferramentas de distribuição.

Entre os resultados demonstrados, destacam-se:

- Integração do React Native com backend Java.
- Autenticação JWT funcionando na API pública.
- Cadastro e gerenciamento dos animais.
- Agendamento de consultas veterinárias.
- Recebimento de lembretes Android.
- Navegação para a Agenda ao tocar em notificações.
- Publicação do backend no Render.
- Geração do APK pelo EAS Build.
- Distribuição da aplicação via Firebase App Distribution.
- Versionamento do código com histórico de commits no GitHub.

O projeto demonstra a aplicação prática de conhecimentos de desenvolvimento mobile, backend, banco de dados, segurança e distribuição de software.

**ClyvoCare OS — Cuidado contínuo para quem faz parte da família. 🐾**

*Projeto acadêmico desenvolvido para a FIAP — Challenge 2026 — Sprint 4.*
