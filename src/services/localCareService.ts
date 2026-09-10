import AsyncStorage from "@react-native-async-storage/async-storage";
import { SelfReportedEvent } from "../types/clinical";

const SELF_REPORTED_KEY = "@clyvocare_self_reported_history_v2";

async function readAll(): Promise<SelfReportedEvent[]> {
  const stored = await AsyncStorage.getItem(SELF_REPORTED_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as SelfReportedEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const localCareService = {
  async listByPet(petId: number): Promise<SelfReportedEvent[]> {
    const events = await readAll();
    return events
      .filter((event) => event.petId === petId)
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  },

  async create(
    data: Omit<SelfReportedEvent, "id" | "createdAt">,
  ): Promise<SelfReportedEvent> {
    const events = await readAll();
    const now = new Date().toISOString();
    const event: SelfReportedEvent = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
    };
    await AsyncStorage.setItem(SELF_REPORTED_KEY, JSON.stringify([event, ...events]));
    return event;
  },

  async remove(eventId: string): Promise<void> {
    const events = await readAll();
    await AsyncStorage.setItem(
      SELF_REPORTED_KEY,
      JSON.stringify(events.filter((event) => event.id !== eventId)),
    );
  },
};
