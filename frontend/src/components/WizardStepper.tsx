interface Step {
  label: string
  path: string
}

interface Props {
  steps: Step[]
  currentIndex: number
}

export default function WizardStepper({ steps, currentIndex }: Props) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={step.path} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                  ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-secondary border-secondary text-white' : 'bg-white border-gray-300 text-gray-400'}`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium hidden sm:block ${active ? 'text-secondary' : done ? 'text-green-600' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
