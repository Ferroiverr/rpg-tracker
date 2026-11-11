export type CharacterStatus = "pending" | "approved" | "rejected" | "archived";
export type CardType = "attack" | "defense" | "healing";

export interface Character {
  id: string;
  user_id: string;
  name: string;
  max_hp: number;
  current_hp: number;
  armor: number;
  image_url: string | null;
  image_path: string | null;
  status: CharacterStatus;
  created_at: string;
  updated_at: string;
}

export interface CharacterCard {
  id: string;
  character_id: string;
  type: CardType;
  name: string;
  description: string;
  created_at: string;
}

export interface CharacterAction {
  id: string;
  character_id: string;
  action_type: string;
  amount: number;
  blocked_amount: number;
  hp_before: number;
  hp_after: number;
  armor_before: number;
  armor_after: number;
  note: string;
  created_at: string;
}

export function statusLabel(status: CharacterStatus) {
  const labels: Record<CharacterStatus, string> = {
    pending: "На модерации",
    approved: "Одобрен",
    rejected: "Отклонён",
    archived: "В архиве",
  };
  return labels[status] || status;
}

export function actionLabel(type: string) {
  const labels: Record<string, string> = {
    damage: "Урон",
    heal: "Лечение",
    set_armor: "Установка брони",
    status_approved: "Одобрение персонажа",
    status_rejected: "Отклонение заявки",
    status_archived: "Перевод в архив",
  };
  return labels[type] || type;
}
