# 🐾 ClyvoCare OS — Mobile | Sprint 4

Aplicativo mobile acadêmico da **FIAP**, desenvolvido para auxiliar tutores no acompanhamento da saúde e da rotina de cuidados de seus pets.

**Versão:** 1.0.0 · **Plataforma demonstrada:** Android · **Repositório:** [marina-2907/clyvocare-mobile-3](https://github.com/marina-2907/clyvocare-mobile-4) · **Branch principal e de entrega:** `feat/sprint4-release`

> **Aviso:** orientações e alertas do ClyvoCare têm caráter informativo e não substituem a avaliação de um médico-veterinário.

## 1. Sobre o projeto

O ClyvoCare centraliza informações do tutor e de seus animais, com cadastro de múltiplos pets, agenda de consultas, histórico de saúde, alertas e recomendações preventivas. O aplicativo mobile consome uma **API REST Java com Spring Boot**, que persiste os dados principais em **Oracle Database**.

O módulo **Clyvo IA** utiliza regras determinísticas e informações disponíveis no sistema; não realiza diagnósticos veterinários nem representa integração comprovada com um modelo de IA generativa.

## 2. Funcionalidades

| Módulo | Recursos |
| --- | --- |
| Autenticação | Cadastro de tutor, login JWT, persistência da sessão e logout |
| Home | Resumo do pet selecionado e atalhos para cuidados |
| Meus Pets | Listagem, seleção, cadastro, edição e exclusão de pets |
| Cadastro de Pets | Espécies carregadas da API, informações do animal e identificação visual das espécies |
| Agenda | Consultas, datas, horários, profissionais, clínicas e situações |
| Histórico | Consultas, vacinas, exames, tratamentos e registros associados ao pet |
| Clyvo IA / Alertas | Orientações preventivas baseadas nos dados do sistema |
| Perfil | Consulta e edição de informações do tutor e saída da conta |
| Sobre o App | Versão do aplicativo e campo para identificação do commit usado no build |

### Novidades da Sprint 4 — notificações locais

- Integração de `expo-notifications` ao aplicativo Android, validada em **APK gerado com EAS Build**.
- Solicitação de permissão de notificações e criação do canal Android `consultas`.
- Quando uma consulta é salva pela API com horário definido, o app tenta programar um lembrete **uma hora antes** do atendimento.
- O lembrete contém o nome do pet, o horário da consulta e os dados `tipo: "consulta"`, `consultaId` e `tela: "Agenda"`.
- Se o horário do lembrete já passou, a notificação não é programada; falha no agendamento da notificação não desfaz a consulta salva.

**Validação concluída:** foi verificado no emulador Android o recebimento real do lembrete da consulta e a navegação para a aba **Agenda** ao tocar na notificação. Alertas internos do app e notificações do Android são funcionalidades diferentes.

## 3. Arquitetura

```text
ClyvoCare Mobile (React Native + Expo + TypeScript)
                |
             HTTP/REST
              JWT
                |
       API Java (Spring Boot)
     Spring Security / JPA
                |
        JDBC / Hibernate
                |
         Oracle Database
             FIAP ORCL
```

O aplicativo não acessa o Oracle diretamente: toda consulta ou alteração de dados persistidos passa pela API.

### Tecnologias

**Mobile:** React Native, Expo SDK 54, TypeScript, React Navigation, TanStack React Query, AsyncStorage, Expo Vector Icons, Expo Notifications e Expo Dev Client.

**Backend:** Java, Spring Boot, Spring Web, Spring Data JPA, Spring Security, JWT, Hibernate, Gradle e Flyway.

**Banco:** Oracle Database (ambiente FIAP).

## 4. Organização do repositório

```text
clyvocare-mobile-3/
├── assets/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   │   └── useClinical.ts
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   │   ├── api.ts
│   │   ├── clinicalService.ts
│   │   └── notificationService.ts
│   ├── types/
│   └── utils/
├── backend-java/
│   ├── src/main/
│   ├── src/test/
│   └── gradlew.bat
├── App.tsx
├── app.json
├── package.json
├── package-lock.json
└── README.md
```

## 5. Como executar localmente

### Pré-requisitos

Git, Node.js, npm, Android Studio (emulador e SDK Android), JDK **17** para o build Android, e acesso autorizado ao Oracle FIAP para executar o backend. O primeiro build nativo pode demorar porque baixa e compila dependências Android.

### Clonar o projeto

```powershell
git clone -b feat/sprint4-release https://github.com/marina-2907/clyvocare-mobile-3.git
cd clyvocare-mobile-3
npm ci
```

### Backend Java

Em um terminal PowerShell separado:

```powershell
cd backend-java
$env:DB_USERNAME="SEU_USUARIO_ORACLE"
$env:DB_PASSWORD="SUA_SENHA_ORACLE"
$env:JWT_SECRET="SUA_CHAVE_JWT_CONFIGURADA"
# Apenas quando necessário no banco de demonstração compartilhado:
# $env:SPRING_FLYWAY_ENABLED="false"
.\gradlew.bat bootRun
```

O serviço local utilizado nos testes é `http://localhost:8080`. **A API da versão distribuída está hospedada no Render**: https://clyvocare-api.onrender.com. Para verificar uma rota pública que retorna JSON, consulte [GET /api/cities](https://clyvocare-api.onrender.com/api/cities); uma resposta `[]` representa lista vazia. A rota raiz (`/`) pode retornar HTTP 403 por causa da configuração do Spring Security. As credenciais e a chave JWT não devem ser publicadas no GitHub.

### Mobile Android

Em outro terminal, na raiz do projeto:

```powershell
npm ci
npx expo run:android
```

O comando gera e instala uma **development build** para Android. Na primeira execução, é necessário ter o emulador aberto e o JDK/SDK configurados. Para reiniciar somente o bundler em uma instalação já existente, use:

```powershell
npx expo start --dev-client
```

**Endereço da API:** definido por `EXPO_PUBLIC_API_URL`. No APK de distribuição, foi incorporado `https://clyvocare-api.onrender.com` por meio do ambiente `preview` do EAS. Sem essa variável, o emulador Android utiliza `http://10.0.2.2:8080`, que aponta para o `localhost` do computador e não funciona em celulares externos.

## 6. Testes e validação

- O aplicativo foi executado em emulador Android usando `npx expo run:android`, com build Gradle concluído (`BUILD SUCCESSFUL`).
- Foi executada a checagem TypeScript `npx tsc --noEmit`, sem erros reportados no terminal.
- O fluxo do aplicativo e os alertas foram testados durante o desenvolvimento.
- Foi confirmado no emulador Android o **recebimento real da notificação** e o **toque abrindo a Agenda**.
- A API hospedada no Render respondeu ao endpoint público `/api/cities` e houve autenticação online bem-sucedida no endpoint de login (`OWNER`).
- O APK de distribuição foi compilado com a API HTTPS pública e instalado no emulador; também foram testados login, cadastro de pet e agenda.

Para checar o TypeScript novamente:

```powershell
npx tsc --noEmit
```

Para executar testes Java, quando o ambiente de banco estiver configurado:

```powershell
cd backend-java
.\gradlew.bat test
```

## 7. Persistência e segurança

O backend concentra dados de tutores, pets, espécies, consultas, vacinas, exames, tratamentos e registros clínicos. Os endpoints protegidos utilizam autenticação JWT. Configurações sensíveis do Oracle e do JWT são recebidas por variáveis de ambiente; não devem ser incluídas em commits nem no vídeo.

## 8. Publicação e evidências — Sprint 4

A entrega final da versão **1.0.0** foi gerada com **EAS Build**, hospedando o backend **Spring Boot** no **Render** e distribuindo o APK pelo **Firebase App Distribution**. Foram convidados três testadores na versão de 03/11/2026; no registro da distribuição, os convites ainda aguardavam aceitação.

### Links da entrega

| Item | Link / evidência |
| --- | --- |
| **GitHub — código e histórico de commits** | [Repositório ClyvoCare OS](https://github.com/marina-2907/clyvocare-mobile-3) — branch padrão `feat/sprint4-release` |
| **Vídeo final Sprint 4** | [Assistir à apresentação no YouTube](https://youtu.be/gz9HC7dxdnA) |
| **API Java — Render (rota pública de teste)** | [GET /api/cities](https://clyvocare-api.onrender.com/api/cities) |
| **API Java — URL base** | [https://clyvocare-api.onrender.com](https://clyvocare-api.onrender.com) |
| **APK Android — EAS Build** | [Abrir e baixar o build de distribuição](https://expo.dev/accounts/marina_2901/projects/clyvocare-mobile/builds/36c84caa-79ce-4bfd-98d1-4d4f91b24bb7) |
| **Firebase App Distribution** | APK 1.0.0 distribuído para três testadores convidados; aceitação e instalação dependem de cada destinatário |
| **Commit do APK publicado (Sobre o App)** | `bf65ef788a7d2728272a0afb6ef1cffd4c81858f` |

O APK foi compilado com `EXPO_PUBLIC_API_URL=https://clyvocare-api.onrender.com` e `EXPO_PUBLIC_GIT_COMMIT_SHA=bf65ef788a7d2728272a0afb6ef1cffd4c81858f`. **Esse SHA identifica o código usado no APK**, e pode ser anterior a commits posteriores de documentação, sem representar divergência de versão.

A rota pública `/api/cities` pode retornar `[]`, indicando que não há cidades cadastradas. A rota raiz da API é protegida por Spring Security e não é uma página web de apresentação.

### Demonstração anterior da versão integrada

[Vídeo da integração Mobile + Java + Oracle](https://youtu.be/wZORlbeUca0). A demonstração **final da Sprint 4** está no link indicado acima.

## 9. Integrantes

| Integrante | RM |
| --- | --- |
| Felipe Maglio Filho | 563512 |
| João Pedro Bitencourt Goldoni | 564339 |
| Marina Tamagnini Magalhães | 561786 |
| Mateus Granja dos Santos | 564930 |
| Vitória Valentina Maglio | 563509 |

---

**ClyvoCare OS — Projeto acadêmico FIAP.** Código integrado e versionado. Entrega Sprint 4 documentada com vídeo final, build Android, API pública e distribuição via Firebase. A aceitação do convite e a instalação pelo avaliador são etapas externas ainda dependentes dos testadores.
