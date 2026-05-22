# ClyvoCare Mobile

Aplicativo mobile desenvolvido em React Native com Expo para auxiliar tutores no acompanhamento da saúde dos seus pets.

O ClyvoCare permite cadastrar pets, visualizar informações principais, acompanhar histórico de saúde, agenda de cuidados, alertas inteligentes, perfil do tutor e planos de cuidado. Nesta sprint, o foco foi criar um protótipo funcional com navegação entre telas, formulário com manipulação de estado e persistência local utilizando AsyncStorage.

---

## Objetivo do Projeto

O objetivo do ClyvoCare é oferecer uma solução simples, intuitiva e funcional para centralizar informações importantes sobre a saúde dos pets, ajudando o tutor a acompanhar vacinas, consultas, exames, tratamentos e recomendações preventivas.

Nesta versão mobile, o aplicativo simula o funcionamento da solução utilizando armazenamento local no dispositivo.

---

## Tecnologias Utilizadas

- React Native
- Expo
- TypeScript
- React Navigation
- AsyncStorage
- Expo Image Picker
- React Native SVG
- Expo Vector Icons

---

## Funcionalidades

### Home

A tela inicial apresenta um resumo geral do aplicativo, incluindo:

- Pet em destaque
- Score inteligente de saúde
- Resumo de vacinas e cuidados
- Próximos cuidados sugeridos
- Acesso rápido para outras telas
- Alertas inteligentes
- Planos ClyvoCare

---

### Cadastro de Pet

A tela de cadastro permite registrar informações do animal, como:

- Nome do pet
- Espécie
- Raça
- Idade
- Peso
- Situação vacinal
- Castração
- Vacinas e cuidados preventivos
- Carteirinha de vacinação
- Documentação do animal, quando aplicável
- Histórico de saúde e observações

O formulário utiliza manipulação de estado com `useState`, permitindo que os dados sejam atualizados dinamicamente conforme o usuário preenche os campos.

Além disso, o app calcula um score inteligente de saúde em tempo real, considerando informações como espécie, idade, peso, vacinas, documentação, castração e histórico clínico.

---

### Meus Pets

A tela de Meus Pets permite:

- Visualizar todos os pets cadastrados
- Escolher qual pet aparece em destaque na Home
- Editar informações de um pet
- Excluir pets cadastrados
- Visualizar score, status e informações principais

---

### Histórico do Pet

A tela de histórico permite registrar eventos relacionados à saúde do pet, como:

- Consultas
- Vacinas
- Exames
- Tratamentos

Cada registro é associado a um pet específico e salvo localmente. A tela também apresenta um gráfico simples de evolução da saúde com base nas notas registradas.

---

### Agenda Inteligente

A agenda gera recomendações automáticas com base nos dados cadastrados do pet.

Exemplos de recomendações:

- Revisão vacinal
- Consulta inicial para pet resgatado
- Exames preventivos
- Avaliação de castração
- Tratamentos sugeridos
- Revisão do histórico de saúde

As recomendações são geradas de forma personalizada conforme a espécie, situação vacinal, castração, vacinas e observações clínicas.

---

### Alertas IA

A tela de Alertas IA simula uma inteligência artificial baseada em regras inteligentes.

Ela analisa os dados cadastrados do pet e gera alertas preventivos, classificados por nível de risco:

- Baixo
- Médio
- Alto

Os alertas podem ser marcados como resolvidos e essa informação também é salva localmente.

---

### Perfil do Tutor

A tela de perfil permite:

- Criar perfil do tutor
- Editar informações pessoais
- Excluir perfil
- Visualizar quantidade de pets cadastrados
- Gerenciar plano ClyvoCare
- Escolher plano mensal ou anual

Os dados do perfil e do plano são armazenados localmente com AsyncStorage.

---

## Armazenamento Local

Nesta sprint, o aplicativo utiliza `AsyncStorage` para persistência local dos dados.

São armazenadas informações como:

- Pets cadastrados
- Pet escolhido para aparecer na Home
- Histórico de saúde dos pets
- Alertas resolvidos
- Perfil do tutor
- Plano atual

Mesmo após recarregar o aplicativo, os dados continuam disponíveis, pois são restaurados a partir do armazenamento local.

Na próxima etapa do projeto, a proposta é integrar esses dados com uma API em Java e banco de dados.

---

## Navegação entre Telas

O aplicativo possui navegação entre múltiplas telas, incluindo:

- Home
- Cadastro de Pet
- Meus Pets
- Histórico
- Agenda
- Alertas IA
- Perfil

A navegação foi implementada utilizando React Navigation.

---

## Como Executar o Projeto

### Pré-requisitos

Antes de iniciar, é necessário ter instalado:

- Node.js
- Expo
- Android Studio
- Emulador Android configurado
- Git

---

### Instalação

Clone o repositório:

bash

git clone (https://github.com/2TDSPX/challenge12-clyvocare.git)

Acesse a pasta do projeto:

cd clyvocare-mobile

Instale as dependências:

npm install

Execute o projeto:

npx expo start

Para abrir no emulador Android, pressione:

a

Também é possível iniciar limpando o cache:

npx expo start -c
Demonstração em Vídeo

Link do vídeo demonstrativo:

https://youtu.be/sRD3OKg5e8o?si=OvWMKN_U3sQqHh_G

## O vídeo demonstra:

Execução do app em emulador Android
Navegação entre as telas
Cadastro de pet com formulário funcional
Manipulação de estado com useState
Persistência local com AsyncStorage
Restauração dos dados após recarregar o app
Funcionamento da Home, Meus Pets, Histórico, Agenda, Alertas IA e Perfil
Estrutura Principal do Projeto
src/
├── navigation/
│   └── index.tsx
│
├── screens/
│   ├── HomeScreen.tsx
│   ├── PetRegisterScreen.tsx
│   ├── PetListScreen.tsx
│   ├── TimelineScreen.tsx
│   ├── ScheduleScreen.tsx
│   ├── AlertScreen.tsx
│   └── ProfileScreen.tsx
Critérios Atendidos
### 1. Navegação entre telas

O app possui mais de cinco rotas navegáveis e permite fluxo entre Home, Cadastro, Meus Pets, Histórico, Agenda, Alertas IA e Perfil.

### 2. Protótipo visual funcional

Todas as telas possuem layout visual estruturado e coerente com o fluxo de uso da solução.

### 3. Formulário com manipulação de estado

O cadastro de pet e o perfil do tutor utilizam useState para controlar os campos. Os dados são atualizados conforme o usuário preenche as informações.

### 4. Armazenamento local com AsyncStorage

O app salva dados localmente usando AsyncStorage, incluindo pets, perfil, histórico, plano e alertas resolvidos.

### 5. Demonstração em vídeo narrada

O vídeo demonstrativo apresenta o funcionamento do app em emulador Android, mostrando navegação, formulário, persistência local e restauração dos dados.

## Observações

Nesta sprint, o armazenamento foi feito localmente com AsyncStorage, conforme solicitado nos requisitos da disciplina. A integração com banco de dados e API Java será desenvolvida em uma etapa futura.

A funcionalidade de foto do pet também foi planejada para uma próxima entrega, quando houver integração com API e persistência adequada das imagens.

# Integrantes

- Felipe Maglio Filho - RM 563512

- João Pedro Bitencourt Goldoni - RM 564339

- Marina Tamagnini Magalhães - RM 561786

- Mateus Granja dos Santos - RM 564930

- Vitória Valentina Maglio - RM 563509

## Status do Projeto

Projeto desenvolvido para a 1ª Sprint da disciplina Mobile Application Development.

### Status: finalizado para entrega.
