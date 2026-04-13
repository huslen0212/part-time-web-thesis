import { Response } from 'express';

// userId => нээлттэй SSE холболтуудын жагсаалт
const clients = new Map<number, Response[]>();

export function addClient(userId: number, res: Response) {
  const list = clients.get(userId) ?? [];
  clients.set(userId, [...list, res]);
}

export function removeClient(userId: number, res: Response) {
  const list = clients.get(userId) ?? [];
  clients.set(userId, list.filter((r) => r !== res));
}

export function sendToUser(userId: number, data: object) {
  const list = clients.get(userId) ?? [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of list) {
    try {
      res.write(payload);
    } catch {
      // холболт алдаатай бол алгасна
    }
  }
}
