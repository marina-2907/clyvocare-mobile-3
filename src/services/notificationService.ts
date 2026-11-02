
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Define como as notificações aparecem com o app aberto.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Solicita autorização para enviar notificações.
export async function configurarNotificacoes() {
  if (Platform.OS === "web") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("consultas", {
      name: "Lembretes de consultas",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  const permissaoAtual = await Notifications.getPermissionsAsync();

  let status = permissaoAtual.status;

  if (status !== "granted") {
    const resposta = await Notifications.requestPermissionsAsync();
    status = resposta.status;
  }

  return status === "granted";
}

export async function agendarNotificacaoConsulta(
  consultaId: number,
  nomePet: string,
  dataConsulta: string,
  horario: string
) {
  const permitido = await configurarNotificacoes();

  if (!permitido) {
    return null;
  }

  // Converte a data e o horário da consulta.
  const dataHora = new Date(`${dataConsulta}T${horario}:00`);

  if (Number.isNaN(dataHora.getTime())) {
    throw new Error("Data ou horário da consulta inválido.");
  }

  // Programa o lembrete para 1 hora antes da consulta.
  const dataLembrete = new Date(
    dataHora.getTime() - 60 * 60 * 1000
  );

  // Não agenda notificações para horários que já passaram.
  if (dataLembrete.getTime() <= Date.now()) {
    return null;
  }

  const identificador =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🐾 Lembrete ClyvoCare",
        body: `${nomePet} tem uma consulta veterinária às ${horario}.`,
        sound: "default",
        data: {
          tipo: "consulta",
          consultaId,
          tela: "Agenda",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dataLembrete,
        ...(Platform.OS === "android"
          ? { channelId: "consultas" }
          : {}),
      },
    });

  return identificador;
}
