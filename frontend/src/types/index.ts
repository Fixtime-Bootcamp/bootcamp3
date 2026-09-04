export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  active: boolean;
};

export type Technician = {
  id: number;
  name: string;
  email: string;
  phone: string;
  active: boolean;
};

export type Service = {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
};

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export type Appointment = {
  id: number;
  customerId: number;
  technicianId: number;
  serviceId: number;
  startsAt: string;
  endsAt: string;
  durationMinutes?: number;
  status: AppointmentStatus;
};

export type CreateAppointmentInput = {
  customerId: number;
  technicianId: number;
  serviceId: number;
  startsAt: string;
  durationMinutes: number;
};

export type ApiErrorResponse = {
  timestamp?: string;
  status: number;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'CONFLICT'
  | 'BUSINESS_RULE_VIOLATION'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'MALFORMED_JSON'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: { status?: number; fieldErrors?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
  }
}
