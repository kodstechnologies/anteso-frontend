import { CheckCircle } from "lucide-react"

interface SuccessAlertProps {
  message: string
}

export default function SuccessAlert({ message }: SuccessAlertProps) {
  return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-300 text-green-800 rounded-lg p-4 shadow-md w-full max-w-md mt-4">
      <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold">{message}</p>
      </div>
    </div>
  )
}
