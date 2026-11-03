
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// =====================================================
// EXIBIÇÃO DAS NOTIFICAÇÕES
// =====================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// =====================================================
// PERMISSÕES
// =====================================================

export async function configurarNotificacoes() {
  if (Platform.OS === "web") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "consultas",
      {
        name: "Lembretes de consultas",
        importance:
          Notifications.AndroidImportance.HIGH,
        sound: "default",
      }
    );
  }

  const permissaoAtual =
    await Notifications.getPermissionsAsync();

  let permitido = permissaoAtual.granted;

  if (!permitido) {
    const resposta =
      await Notifications.requestPermissionsAsync();

    permitido = resposta.granted;
  }

  console.log(
    "[CLYVO] Permissão para notificações:",
    permitido ? "PERMITIDA" : "NEGADA"
  );

  return permitido;
}

// =====================================================
// AGENDAR LEMBRETE DE CONSULTA
// =====================================================

export async function agendarNotificacaoConsulta(
  consultaId: number,
  nomePet: string,
  dataConsulta: string,
  horario: string
) {
  const permitido = await configurarNotificacoes();

  if (!permitido) {
    console.warn(
      "[CLYVO] Notificação não agendada: " +
      "permissão para notificações negada."
    );

    return null;
  }

  // Valida a data e o horário recebidos da API.
  const partesData =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataConsulta);

  const partesHorario =
    /^(\d{2}):(\d{2})$/.exec(horario);

  if (!partesData || !partesHorario) {
    throw new Error(
      "Formato de data ou horário inválido."
    );
  }

  const ano = Number(partesData[1]);
  const mes = Number(partesData[2]);
  const dia = Number(partesData[3]);

  const hora = Number(partesHorario[1]);
  const minuto = Number(partesHorario[2]);

  // Usa o fuso horário configurado no aparelho.
  const dataHora = new Date(
    ano,
    mes - 1,
    dia,
    hora,
    minuto,
    0
  );

  if (
    dataHora.getFullYear() !== ano ||
    dataHora.getMonth() !== mes - 1 ||
    dataHora.getDate() !== dia ||
    dataHora.getHours() !== hora ||
    dataHora.getMinutes() !== minuto
  ) {
    throw new Error(
      "Data ou horário da consulta inválido."
    );
  }

  // Lembrete: uma hora antes da consulta.
  const dataLembrete = new Date(
    dataHora.getTime() - 60 * 60 * 1000
  );

  console.log(
    "[CLYVO] Horário atual:",
    new Date().toString()
  );

  console.log(
    "[CLYVO] Consulta:",
    dataHora.toString()
  );

  console.log(
    "[CLYVO] Lembrete previsto:",
    dataLembrete.toString()
  );

  // Não agenda lembretes no passado.
  if (dataLembrete.getTime() <= Date.now()) {
    console.warn(
      "[CLYVO] Lembrete ignorado: " +
      "o horário da notificação já passou."
    );

    return null;
  }

  // Solicita o agendamento ao sistema operacional.
  const identificador =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🐾 Lembrete ClyvoCare",
        body:
          `${nomePet} tem uma consulta ` +
          `veterinária às ${horario}.`,
        sound: "default",
        data: {
          tipo: "consulta",
          consultaId,
          tela: "Agenda",
        },
      },
      trigger: {
        type:
          Notifications.SchedulableTriggerInputTypes.DATE,
        date: dataLembrete,
        ...(Platform.OS === "android"
          ? { channelId: "consultas" }
          : {}),
      },
    });

  // Confere se o lembrete consta na lista do Expo.
  const agendadas =
    await Notifications.getAllScheduledNotificationsAsync();

  const encontrado = agendadas.some(
    (notificacao) =>
      notificacao.identifier === identificador
  );

  console.log(
    "[CLYVO] ID retornado:",
    identificador
  );

  console.log(
    "[CLYVO] Total de notificações agendadas:",
    agendadas.length
  );

  if (!encontrado) {
    throw new Error(
      "O Expo retornou um identificador, " +
      "mas a notificação não foi encontrada " +
      "na lista de agendamentos."
    );
  }

  console.log(
    "[CLYVO] Notificação confirmada " +
    "na lista de agendamentos."
  );

  return identificador;
}
