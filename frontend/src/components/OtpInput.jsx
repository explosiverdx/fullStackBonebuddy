import React, { useRef, useEffect } from 'react';

/**
 * 6-box OTP input. Calls onChange with the full 6-digit string.
 */
export default function OtpInput({ value = '', onChange, disabled = false, id = 'otp-input', className = '' }) {
  const digits = value.replace(/\D/g, '').slice(0, 6).split('');
  const refs = useRef([...Array(6)].map(() => null));

  useEffect(() => {
    refs.current = refs.current.slice(0, 6);
  }, []);

  const handleChange = (index, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.replace(/\D/g, '').slice(0, 6).split('');
    while (arr.length < 6) arr.push('');
    arr[index] = v;
    const next = arr.join('').slice(0, 6);
    onChange(next);
    if (v && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      refs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={`flex justify-center gap-2 ${className}`} id={id}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digits[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl bg-gray-50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all disabled:opacity-50"
        />
      ))}
    </div>
  );
}
