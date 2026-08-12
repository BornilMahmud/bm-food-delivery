import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const writeAdminAuditLog = async (input: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue?: unknown;
  newValue?: unknown;
}) => {
  await addDoc(collection(db, 'auditLogs'), {
    ...input,
    previousValue: input.previousValue ?? null,
    newValue: input.newValue ?? null,
    createdAt: serverTimestamp(),
  });
};
