import { FormErrorMessages } from './form-error-messages';

describe('FormErrorMessages', () => {
  it('should expose slugRequired message', () => {
    expect(FormErrorMessages.slugRequired).toBeTruthy();
  });

  it('should expose slugPattern message', () => {
    expect(FormErrorMessages.slugPattern).toBeTruthy();
  });

  it('should expose slugMaxLength message', () => {
    expect(FormErrorMessages.slugMaxLength).toBeTruthy();
  });

  it('should expose nameRequired message', () => {
    expect(FormErrorMessages.nameRequired).toBeTruthy();
  });

  it('should have distinct messages', () => {
    const messages = [
      FormErrorMessages.slugRequired,
      FormErrorMessages.slugPattern,
      FormErrorMessages.slugMaxLength,
      FormErrorMessages.nameRequired,
    ];
    expect(new Set(messages).size).toBe(messages.length);
  });
});
