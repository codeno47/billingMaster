import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SparklineData {
  month: string;
  billing: number;
  employees: number;
  averageRate: number;
}

interface SparklineChartProps {
  data: SparklineData[];
  dataKey: 'billing' | 'employees' | 'averageRate';
  color: string;
  title: string;
  format?: 'currency' | 'number' | 'rate';
  height?: number;
}

export function SparklineChart({ 
  data, 
  dataKey, 
  color, 
  title, 
  format = 'number',
  height = 60 
}: SparklineChartProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'rate':
        return `$${value.toFixed(2)}`;
      default:
        return value.toString();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-medium">{title}</p>
          <p className="text-gray-600">{label}: {formatValue(value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis 
            dataKey="month" 
            hide 
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, stroke: color, strokeWidth: 2, fill: 'white' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface InteractiveSparklineProps {
  data: SparklineData[];
  costCentre: string;
}

export function InteractiveSparkline({ data, costCentre }: InteractiveSparklineProps) {
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  
  const getChangeIndicator = (current: number, previous: number) => {
    if (!previous) return { change: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { change: Math.abs(change), isPositive: change >= 0 };
  };

  const billingChange = getChangeIndicator(latestData.billing, previousData?.billing || 0);
  const employeeChange = getChangeIndicator(latestData.employees, previousData?.employees || 0);
  const rateChange = getChangeIndicator(latestData.averageRate, previousData?.averageRate || 0);

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">{costCentre} Performance Trends</h4>
        <span className="text-xs text-gray-500">Last 6 months</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Monthly Billing</span>
            <span className={`text-xs flex items-center ${billingChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {billingChange.isPositive ? '↗' : '↘'} {billingChange.change.toFixed(1)}%
            </span>
          </div>
          <SparklineChart
            data={data}
            dataKey="billing"
            color="#10b981"
            title="Monthly Billing"
            format="currency"
            height={50}
          />
          <p className="text-xs font-medium text-gray-900">
            ${latestData.billing.toLocaleString('en-US')}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Active Employees</span>
            <span className={`text-xs flex items-center ${employeeChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {employeeChange.isPositive ? '↗' : '↘'} {employeeChange.change.toFixed(1)}%
            </span>
          </div>
          <SparklineChart
            data={data}
            dataKey="employees"
            color="#3b82f6"
            title="Active Employees"
            format="number"
            height={50}
          />
          <p className="text-xs font-medium text-gray-900">
            {latestData.employees}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Average Rate</span>
            <span className={`text-xs flex items-center ${rateChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {rateChange.isPositive ? '↗' : '↘'} {rateChange.change.toFixed(1)}%
            </span>
          </div>
          <SparklineChart
            data={data}
            dataKey="averageRate"
            color="#f59e0b"
            title="Average Rate"
            format="rate"
            height={50}
          />
          <p className="text-xs font-medium text-gray-900">
            ${latestData.averageRate.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}