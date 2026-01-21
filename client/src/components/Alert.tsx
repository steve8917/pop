import { XCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

type AlertProps = {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
};

const icons = {
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

const colors = {
  error: 'bg-red-50 text-red-700 border border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  success: 'bg-green-50 text-green-800 border border-green-200',
  info: 'bg-blue-50 text-blue-800 border border-blue-200',
};

const Alert = ({ type, message }: AlertProps) => {
  if (!message) return null;

  return (
    <div className={`alert p-4 rounded-md flex items-center space-x-3 ${colors[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default Alert;
