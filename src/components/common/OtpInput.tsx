// src/components/common/OtpInput.tsx
import { useRef, useState, useEffect } from 'react'

interface Props {
    length?: number
    onComplete?: (code: string) => void
    disabled?: boolean
    error?: boolean
}

export default function OtpInput({ length = 6, onComplete, disabled = false, error = false }: Props) {
    const [digits, setDigits] = useState<string[]>(Array(length).fill(''))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const next = [...digits]
        next[index] = value.slice(-1)
        setDigits(next)

        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
        if (next.every(v => v !== '')) {
            onComplete?.(next.join(''))
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').slice(0, length)
        if (!/^\d*$/.test(pasted)) return
        const next = [...digits]
        for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
        setDigits(next)
        const lastIndex = Math.min(pasted.length, length - 1)
        inputRefs.current[lastIndex]?.focus()
        if (next.every(v => v !== '')) onComplete?.(next.join(''))
    }

    return (
        <div className="otp-input-row" dir="ltr" onPaste={handlePaste}>            {digits.map((digit, i) => (
            <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={disabled}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className="otp-box"
                style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: `1.5px solid ${error ? '#ef4444' : digit ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`,
                    color: '#fff', fontWeight: 700,
                    textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                }}
            />
        ))}
        </div>
    )
}