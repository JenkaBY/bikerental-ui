import { describe, expect, it } from 'vitest';
import type { CustomerResponse } from '@api-models';
import type { CustomerWrite } from '@ui-models';
import { CustomerMapper } from './customer.mapper';

describe('CustomerMapper', () => {
  it('maps CustomerResponse -> Customer (handles missing names and parses birthDate)', () => {
    const resp = {
      id: 'c-1',
      phone: '+123',
      // firstName and lastName intentionally undefined to exercise ?? ''
      email: 'a@b.com',
      birthDate: '1990-05-12',
      comments: 'VIP customer',
    } as unknown as CustomerResponse;

    const out = CustomerMapper.fromResponse(resp);

    expect(out.id).toBe('c-1');
    expect(out.phone).toBe('+123');
    expect(out.firstName).toBe('');
    expect(out.lastName).toBe('');
    expect(out.email).toBe('a@b.com');
    expect(out.birthDate).toBeInstanceOf(Date);
    expect(out.notes).toBe('VIP customer');
  });

  it('maps CustomerWrite -> CustomerRequest (comments <- notes and preserves birthDate)', () => {
    const write = {
      phone: '+7',
      firstName: 'John',
      lastName: 'Doe',
      email: 'j@d.com',
      birthDate: new Date('2000-01-01'),
      notes: 'some notes',
    } as unknown as CustomerWrite;

    const req = CustomerMapper.toRequest(write);

    expect(req.phone).toBe('+7');
    expect(req.firstName).toBe('John');
    expect(req.lastName).toBe('Doe');
    expect(req.email).toBe('j@d.com');
    expect(req.birthDate).toBe(write.birthDate);
    expect(req.comments).toBe('some notes');
  });
});
