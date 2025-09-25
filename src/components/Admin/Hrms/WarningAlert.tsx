import { AlertTriangle } from "lucide-react"

interface WarningAlertProps {
    message: string
}

export default function WarningAlert({ message }: WarningAlertProps) {
    return (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg p-4 shadow-md w-full max-w-md mt-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div className="flex-1">
                <p className="font-semibold">{message}</p>
            </div>
        </div>
    )
}
