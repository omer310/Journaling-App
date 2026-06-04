let currentUserId: string | null = null;

export function setCurrentUserId(userId: string | null) {
  currentUserId = userId;
}

export function getCurrentUserId() {
  return currentUserId;
}

export function requireCurrentUserId() {
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  return currentUserId;
}
