import { Divider } from 'antd'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const MRR_data = [
  {
    name: '2023-01',
    uv: 2000,
    pv: 2400,
    amt: 2400
  },
  {
    name: '2023-02',
    uv: 3000,
    pv: 1398,
    amt: 2210
  },
  {
    name: '2023-03',
    uv: 2000,
    pv: 9800,
    amt: 2290
  },
  {
    name: '2023-04',
    uv: 2780,
    pv: 3908,
    amt: 2000
  },
  {
    name: '2023-05',
    uv: 1890,
    pv: 4800,
    amt: 2181
  },
  {
    name: '2023-06',
    uv: 4000,
    pv: 2400,
    amt: 2400
  },
  {
    name: '2023-07',
    uv: 3000,
    pv: 1398,
    amt: 2210
  },
  {
    name: '2023-08',
    uv: 2000,
    pv: 9800,
    amt: 2290
  },
  {
    name: '2023-09',
    uv: 2780,
    pv: 3908,
    amt: 2000
  },
  {
    name: '2023-10',
    uv: 1890,
    pv: 4800,
    amt: 2181
  },
  {
    name: '2023-11',
    uv: 3390,
    pv: 3800,
    amt: 2500
  },
  {
    name: '2023-12',
    uv: 4490,
    pv: 4300,
    amt: 2100
  }
]

const User_data = [
  { name: '1', new: 300, leave: -56 },
  { name: '2', new: 145, leave: -30 },
  { name: '3', new: 100, leave: -45 },
  { name: '4', new: 8, leave: -50 },
  { name: '5', new: 100, leave: -21 },
  { name: '6', new: 9, leave: -35 },
  { name: '7', new: 53, leave: -67 },
  { name: '8', new: 252, leave: -78 },
  { name: '9', new: 79, leave: -10 },
  { name: '10', new: 294, leave: -23 },
  { name: '12', new: 43, leave: -45 },
  { name: '13', new: 74, leave: -90 },
  { name: '14', new: 271, leave: -30 },
  { name: '15', new: 117, leave: -11 },
  { name: '16', new: 186, leave: -7 },
  { name: '17', new: 216, leave: -26 },
  { name: '18', new: 125, leave: -53 },
  { name: '19', new: 222, leave: -66 },
  { name: '20', new: 372, leave: -86 },
  { name: '21', new: 182, leave: -12 },
  { name: '22', new: 164, leave: -2 },
  { name: '23', new: 316, leave: -25 },
  { name: '24', new: 131, leave: -67 },
  { name: '25', new: 291, leave: -90 },
  { name: '26', new: 47, leave: -94 },
  { name: '27', new: 415, leave: -71 },
  { name: '28', new: 182, leave: -76 },
  { name: '29', new: 93, leave: -95 },
  { name: '30', new: 99, leave: -22 },
  { name: '31', new: 52, leave: -46 },
  { name: '32', new: 154, leave: -33 },
  { name: '33', new: 205, leave: -54 },
  { name: '34', new: 70, leave: -58 },
  { name: '35', new: 25, leave: -59 },
  { name: '36', new: 59, leave: -92 },
  { name: '37', new: 63, leave: -64 },
  { name: '38', new: 91, leave: -2 },
  { name: '39', new: 66, leave: -54 },
  { name: '40', new: 50, leave: -86 }
]

const Plan_data = [
  { name: 'Plan A(Solo)', value: 400 },
  { name: 'Plan B(Team)', value: 300 },
  { name: 'Plan C(Premium)', value: 200 },
  { name: 'Plan D(Custom)', value: 50 }
]
const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  index: number
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const APP_PATH = import.meta.env.BASE_URL
const API_URL = import.meta.env.VITE_API_URL

const Index = () => {
  const [errMsg, setErrMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('merchantToken')
    setErrMsg('')
    axios
      .get(`${API_URL}/merchant/profile`, {
        headers: {
          Authorization: `${token}` // Bearer: ******
        }
      })
      .then((res) => {
        console.log('merchant dashboard as profile res: ', res)
        const statuCode = res.data.code
        if (statuCode != 0) {
          if (statuCode == 61) {
            console.log('invalid token')
            navigate(`${APP_PATH}login`, {
              state: { msg: 'session expired, please re-login' }
            })
            return
          }
          throw new Error(res.data.message)
        }
      })
      .catch((err) => {
        console.log('login merchant profile err: ', err.message)
        // todo: show a toast
        setErrMsg(err.message)
      })
  }, [])

  return (
    <div>
      <Divider orientation="left" style={{ margin: '32px 0' }}>
        MRR
      </Divider>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          width={500}
          height={200}
          data={MRR_data}
          syncId="anyId"
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </ResponsiveContainer>

      <Divider orientation="left" style={{ margin: '32px 0' }}>
        Users
      </Divider>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          width={500}
          height={300}
          data={User_data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }} />
          <ReferenceLine y={0} stroke="#000" />
          <Brush dataKey="name" height={30} stroke="#8884d8" />
          <Bar dataKey="new" fill="#8884d8" />
          <Bar dataKey="leave" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>

      <Divider orientation="left" style={{ margin: '32px 0' }}>
        Plans
      </Divider>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart width={200} height={200}>
          <Pie
            data={Plan_data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {Plan_data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <div>hehe</div>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Index
