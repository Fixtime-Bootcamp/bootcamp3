import { describe, expect, it } from 'vitest';
import type { Appointment } from '../types';
import {
  getCancelTooltip,
  getCompleteTooltip,
  isCancelEligible,
  isCompleteEligible,
} from './appointmentEligibility';

describe('appointmentEligibility', () => {
  const baseAppointment: Appointment = {
    id: 1,
    customerId: 10,
    technicianId: 20,
    serviceId: 30,
    startsAt: '2026-09-08T14:00:00',
    endsAt: '2026-09-08T15:30:00',
    status: 'SCHEDULED',
  };

  describe('isCancelEligible', () => {
    it('is eligible when scheduled and more than 2 hours before start time', () => {
      const now = new Date('2026-09-08T11:59:00'); // 2h01m before 14:00
      expect(isCancelEligible(baseAppointment, now)).toBe(true);
    });

    it('is eligible when scheduled and exactly 2 hours before start time', () => {
      const now = new Date('2026-09-08T12:00:00'); // exactly 2h before 14:00
      expect(isCancelEligible(baseAppointment, now)).toBe(true);
    });

    it('is ineligible when scheduled and less than 2 hours before start time', () => {
      const now = new Date('2026-09-08T12:01:00'); // 1h59m before 14:00
      expect(isCancelEligible(baseAppointment, now)).toBe(false);
      expect(getCancelTooltip(baseAppointment, now)).toContain('2 horas de antecedência');
    });

    it('is ineligible when already cancelled or completed', () => {
      const now = new Date('2026-09-08T10:00:00');
      expect(isCancelEligible({ ...baseAppointment, status: 'CANCELLED' }, now)).toBe(false);
      expect(isCancelEligible({ ...baseAppointment, status: 'COMPLETED' }, now)).toBe(false);
    });
  });

  describe('isCompleteEligible', () => {
    it('is eligible when scheduled and current time is at or after end time', () => {
      const now = new Date('2026-09-08T15:30:00'); // exactly endsAt
      expect(isCompleteEligible(baseAppointment, now)).toBe(true);

      const later = new Date('2026-09-08T16:00:00');
      expect(isCompleteEligible(baseAppointment, later)).toBe(true);
    });

    it('is ineligible when current time is before end time', () => {
      const now = new Date('2026-09-08T15:29:00'); // 1 min before endsAt
      expect(isCompleteEligible(baseAppointment, now)).toBe(false);
      expect(getCompleteTooltip(baseAppointment, now)).toContain('após o término');
    });

    it('is ineligible when status is not scheduled', () => {
      const now = new Date('2026-09-08T16:00:00');
      expect(isCompleteEligible({ ...baseAppointment, status: 'CANCELLED' }, now)).toBe(false);
      expect(isCompleteEligible({ ...baseAppointment, status: 'COMPLETED' }, now)).toBe(false);
    });
  });
});
