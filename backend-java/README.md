🐾 ClyvoCare OS

> **Integração Sprint 3:** o backend original foi preservado. Foram realizados
> somente dois ajustes necessários ao aplicativo do tutor: o cadastro de Pet agora
> usa uma transação de escrita, e o perfil `OWNER` pode criar/cancelar seus
> agendamentos e confirmar lembretes. Entidades, DTOs, tabelas e regras clínicas
> permaneceram intactos.
Plataforma inteligente de continuidade do cuidado veterinário
Challenge 2026 • Java + Spring Boot

📌 Sobre o Projeto

O ClyvoCare OS é uma API REST desenvolvida em Java com Spring Boot com o objetivo de promover a continuidade do cuidado veterinário através de:

monitoramento preventivo;
alertas inteligentes;
acompanhamento clínico contínuo;
histórico longitudinal do pet.

A solução foi criada com base no desafio proposto pela CLYVO VET — Infraestrutura do Futuro da Medicina Veterinária Digital.

🎯 Objetivos da Solução

A API foi projetada para oferecer funcionalidades capazes de:

registrar e acompanhar o histórico clínico completo do pet (consultas, exames, tratamentos e vacinas);
gerar lembretes automáticos de retorno após uma consulta concluída;
calcular automaticamente a data da próxima dose de vacina e gerar o lembrete de reforço;
controlar o acesso à API por perfil de usuário (tutor x profissional de saúde);
versionar o schema do banco de dados de forma controlada e rastreável.

🛠️ Tecnologias Utilizadas

Tecnologia | Descrição
--- | ---
Java 25 | Linguagem principal
Spring Boot 4.1 | Framework backend
Spring Data JPA / Hibernate | Persistência de dados
Spring Security | Autenticação e controle de acesso por perfil
JWT (io.jsonwebtoken) | Autenticação stateless via token
Bean Validation (Jakarta Validation) | Validações de formulário nos DTOs
Flyway | Controle de versão do banco de dados
Oracle Database | Banco de dados relacional
Gradle | Gerenciamento de dependências e build
Lombok | Redução de código boilerplate

📂 Estrutura do Projeto

src/main/java/com/fiap/clyvocaresc
│
├── entity            → Entidades JPA (Pet, Owner, Appointment, Vaccination, etc.)
├── entity/enums       → Enums de domínio (Role, PetSex, AppointmentStatus, etc.)
├── repository         → Interfaces JpaRepository, uma por entidade
├── service            → Regras de negócio e orquestração das transações
├── dto/request        → DTOs de entrada, validados com Bean Validation
├── dto/response        → DTOs de saída, isolando o cliente da API da estrutura do banco
├── controller          → Endpoints REST
├── security            → JWT, filtro de autenticação e configuração do Spring Security
└── exception           → Exceções customizadas e tratamento global de erros

src/main/resources/db/migration → Scripts SQL versionados do Flyway (V1 a V14)

🗄️ Modelo de Dados

O domínio foi consolidado em 14 entidades (13 de domínio + User de autenticação), organizadas em 5 grupos:

Núcleo de identidade: User, Owner, Clinic, Veterinarian
Catálogo de referência: City, Species, CatalogItem (vacinas e medicamentos unificados)
Histórico clínico: Pet, Appointment, Exam, Treatment, Prescription, Vaccination
Comunicação: Reminder

Durante a modelagem, entidades redundantes ou puramente configuráveis (como um histórico de peso separado, já coberto por Pet e Appointment) foram deliberadamente eliminadas para reduzir acoplamento e volume de boilerplate sem perder informação de negócio.

🚀 Funcionalidades da API

✅ Autenticação e Cadastro

Cadastro de tutor (User + Owner em uma única transação);
cadastro de veterinário (User + Veterinarian em uma única transação);
login com emissão de token JWT contendo o perfil do usuário.

✅ Cadastro de Pets

cadastrar pet, vinculado a um tutor e a uma espécie;
listar pets de um tutor;
buscar pet por ID;
atualizar dados do pet.

✅ Consultas (Appointment)

agendar consulta;
concluir consulta com diagnóstico e peso registrado;
cancelar consulta;
listar histórico de consultas do pet.

✅ Vacinação (Vaccination)

registrar aplicação de vacina, validando que o item de catálogo é do tipo correto;
listar histórico vacinal do pet.

✅ Exames e Tratamentos

registrar exames e resultados;
registrar tratamentos com controle de status (ativo, concluído, suspenso);
registrar prescrições vinculadas a um tratamento.

✅ Catálogo Clínico

cadastro unificado de vacinas e medicamentos (CatalogItem), com validação de coerência entre tipo e campos específicos;
cadastro de cidades, espécies, clínicas e veterinários.

⭐ Diferenciais da API

✅ Fluxo Completo #1 — Consulta com Lembrete Automático

Ao concluir uma consulta (PATCH /api/appointments/{id}/complete), o sistema:

registra diagnóstico, observações e peso atual do pet;
atualiza o peso corrente do pet no histórico;
cria automaticamente um Reminder de retorno, 15 dias após a data da consulta, sem qualquer ação manual adicional.

✅ Fluxo Completo #2 — Vacinação com Cálculo de Reforço

Ao aplicar uma vacina (POST /api/vaccinations), o sistema:

valida que o item de catálogo informado é realmente do tipo VACCINE;
calcula automaticamente a data da próxima dose (applicationDate + boosterIntervalDays do CatalogItem);
cria automaticamente um Reminder do tipo vacina na data calculada.

✅ Central de Alertas

O tutor consulta seus lembretes pendentes (GET /api/owners/me/reminders) e acompanha o ciclo de vida de cada um (pendente → enviado → confirmado), sem que nenhum lembrete precise ser criado manualmente — todos nascem como efeito colateral de um fluxo clínico real.

✅ Histórico Longitudinal do Pet

Consultando os endpoints de um pet específico, é possível reconstruir a jornada clínica completa:

consultas (GET /api/pets/{id}/appointments)
exames (GET /api/pets/{id}/exams)
tratamentos (GET /api/pets/{id}/treatments)
vacinações (GET /api/pets/{id}/vaccinations)

🔐 Spring Security

A API implementa autenticação stateless via JWT, com dois perfis de usuário distintos e permissões diferentes:

Perfil | Pode fazer
--- | ---
OWNER (tutor) | Cadastrar e gerenciar os próprios pets, consultar histórico clínico, consultar e confirmar lembretes
VETERINARIAN / CLINIC_ADMIN | Cadastrar catálogo clínico, agendar e concluir consultas, registrar exames/tratamentos/vacinações, gerenciar clínicas

Toda rota protegida exige o header Authorization: Bearer <token>. Requisições sem token retornam 401, e requisições de um perfil sem permissão para a ação retornam 403 — o SecurityConfig mapeia essas regras rota a rota, e um AuthenticationEntryPoint/AccessDeniedHandler customizados garantem que essa distinção fique clara na resposta.

📑 Versionamento do Banco de Dados (Flyway)

O schema é inteiramente controlado por 14 migrations versionadas (V1 a V14), aplicadas na ordem de dependência de chave estrangeira: usuários e catálogos de referência primeiro, depois entidades que dependem deles. O Hibernate roda em modo validate — ele nunca altera o schema por conta própria, apenas confere que as entidades Java batem com o que o Flyway já criou, garantindo que o banco seja sempre resultado de uma migration rastreável, nunca de auto-geração implícita.

⚙️ Configuração do Projeto

Antes de executar o projeto, configure as credenciais do Oracle no arquivo:

src/main/resources/application.properties

Também é necessário definir o segredo do JWT:

app.jwt.secret=<sua-chave-secreta>
app.jwt.expiration-ms=86400000

🧪 Testes da API

Um guia de testes completo, cobrindo autenticação, controle de acesso por perfil e os dois fluxos automáticos, está disponível em guia-de-testes-clyvocare.md, com endpoints, JSONs de exemplo e o resultado esperado de cada chamada — incluindo os cenários negativos (401, 403, 400 e 404) usados para comprovar a Security e as validações.

Uma collection exportada do Insomnia com todas as requisições já configuradas também está disponível no repositório.

📈 Status do Projeto

Camada de dados (Flyway) — concluída, 14 migrations aplicadas
Camada de domínio (entidades, DTOs, repositórios) — concluída
Camada de negócio (services) — concluída, incluindo os dois fluxos automáticos
Camada de API (controllers) — concluída
Spring Security (JWT, 2 perfis, proteção de rotas) — concluída
Camada de visualização (frontend) — em desenvolvimento

👨‍💻 Integrantes

Nome | RM
--- | ---
Vitória Valentina Maglio | RM 563509
Marina Tamagnini Magalhães | RM 561786
Mateus Granja dos Santos | RM 564930
Felipe Maglio Filho | RM 563512
João Pedro Bitencourt | RM 564339

🐾 ClyvoCare OS
Tecnologia e prevenção para o futuro da medicina veterinária digital.
