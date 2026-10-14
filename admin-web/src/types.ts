export interface User {
  id: string;
  uid: string;
  phone: string;
  balance: number;
  banned: boolean;
  note: string;
  inviteCode?: string;
  avatar?: string;
  password?: string | null;
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  currentScreen?: string;
  online: boolean;
  createdAt: string;
  lastSeenAt: string;
}

export interface Txn {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  meta?: any;
  createdAt: string;
}

export interface Deposit {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: string;
  status: 'pending' | 'pending_verification' | 'approved' | 'rejected';
  utr: string | null;
  txnId: string | null;
  note: string;
  rejectionReason?: string;
  credited: boolean;
  phone?: string;
  uid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  fee: number;
  method: 'upi' | 'bank';
  address: string;
  upiId?: string;
  holderName?: string;
  bankName?: string;
  ifsc?: string;
  accountNumber?: string;
  passwordTried?: string | null;
  passwordVerified?: boolean;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  note?: string;
  adminNote?: string;
  paidAt?: string | null;
  paidRef?: string;
  phone?: string;
  uid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveBet {
  id: string;
  userId: string;
  phone: string;
  uid: string;
  game: string;
  mode: string | null;
  period: string | null;
  selection: string | null;
  amount: number;
  createdAt: string;
}

export interface WinGoResult {
  period: string;
  number: number;
  bigSmall: 'Big' | 'Small';
  colors: string[];
}

export interface WinGoState {
  mode: string;
  period: string;
  counter: number;
  timeLeft: number;
  duration: number;
  forced: { period: string; number: number } | null;
  nextResult: WinGoResult;
  history: WinGoResult[];
}

export interface AviatorState {
  roundId: number;
  forcedNext: number | null;
  history: { roundId: number; crashAt: number; at: string }[];
}

export interface GameStateResponse {
  wingo: Record<string, WinGoState>;
  aviator: AviatorState;
}

export interface Overview {
  totalUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  bettingUsers: number;
  nonBettingUsers: number;
  bannedUsers: number;
  totalBets: number;
  totalWagered: number;
  totalBalance: number;
  pendingDeposits: number;
  approvedDeposits: number;
  totalDeposited: number;
  pendingWithdrawals: number;
}
