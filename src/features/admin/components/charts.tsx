import type { ReactNode } from 'react'
import { cx } from '../../landing/utils'
import s from '../admin.module.css'
import { Icon, type IconName } from './ui'

export function KpiCard({ icon, label, value, detail, series, accent = false }: {
  icon: IconName
  label: string
  value: number
  detail: string
  series: number[]
  accent?: boolean
}) {
  const max = Math.max(1,...series)
  return (
    <article className={cx(s.card, s.kpi, accent && s['kpi--accent'])}>
      <h2 className={s['kpi-top']}>
        <span className={s['kpi-icon']}><Icon name={icon} /></span>
        {label}
      </h2>
      <p className={s['kpi-value']}>{value}<small>{detail}</small></p>
      <div className={s.spark} aria-hidden="true">
        {series.map((point, i) => <span key={i} style={{ height: `${(point / max) * 100}%` }} />)}
      </div>
    </article>
  )
}

type Series = { label: string; color: string; values: number[] }

/** Curva suave (Catmull-Rom convertida a Bézier) que pasa por todos los puntos. */
function smoothPath(points: [number, number][]) {
  return points.reduce((path, [x, y], i) => {
    if (i === 0) return `M${x},${y}`
    const p0 = points[i - 2] ?? points[i - 1]!
    const p1 = points[i - 1]!
    const p2 = points[i + 1] ?? [x, y]
    const c1 = [p1[0] + (x - p0[0]) / 6, p1[1] + (y - p0[1]) / 6]
    const c2 = [x - (p2[0] - p1[0]) / 6, y - (p2[1] - p1[1]) / 6]
    // No dibujar valores negativos o picos inventados al interpolar series con ceros.
    const low=Math.min(p1[1],y),high=Math.max(p1[1],y)
    c1[1]=Math.max(low,Math.min(high,c1[1]!))
    c2[1]=Math.max(low,Math.min(high,c2[1]!))
    return `${path} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x},${y}`
  }, '')
}

export function LineChart({ title, labels, series, max }: { title: string; labels: string[]; series: Series[]; max: number }) {
  const width = 640
  const height = 240
  const pad = { top: 12, right: 12, bottom: 30, left: 34 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const x = (i: number) => pad.left + (i * innerW) / (labels.length - 1)
  const y = (v: number) => pad.top + innerH - (v / max) * innerH
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max]

  return (
    <figure className={s['chart-figure']}>
      <svg className={s.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="activity-chart-desc">
        <desc id="activity-chart-desc">{title}. Los datos se detallan en la tabla siguiente.</desc>
        {ticks.map((t) => (
          <g key={t}>
            <line className={s['chart-grid']} x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
            <text className={s['chart-axis']} x={pad.left - 8} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        {labels.map((label, i) => (
          <text key={label} className={s['chart-axis']} x={x(i)} y={height - 8} textAnchor="middle">{label}</text>
        ))}
        {series.map(({ label, color, values }) => {
          const points = values.map((v, i) => [x(i), y(v)] as [number, number])
          const line = smoothPath(points)
          return (
            <g key={label}>
              <path d={`${line} L${x(values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={color} opacity=".08" />
              <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
              <circle cx={points.at(-1)![0]} cy={points.at(-1)![1]} r="5" fill="#fff" stroke={color} strokeWidth="3" />
            </g>
          )
        })}
      </svg>
      <div className={s['sr-only']}><table>
        <caption>{title}</caption>
        <thead><tr><th scope="col">Semana</th>{series.map((item) => <th key={item.label} scope="col">{item.label}</th>)}</tr></thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label}><th scope="row">{label}</th>{series.map((item) => <td key={item.label}>{item.values[i]}</td>)}</tr>
          ))}
        </tbody>
      </table></div>
    </figure>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className={s.legend}>
      {items.map(({ label, color }) => (
        <li key={label}><span className={s.swatch} style={{ background: color }} />{label}</li>
      ))}
    </ul>
  )
}

export function Donut({ segments, center, footer }: {
  segments: { label: string; value: number; color: string }[]
  center: { value: number; label: string }
  footer?: ReactNode
}) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1
  const arcs = segments.map((seg, i) => {
    const before = segments.slice(0, i).reduce((sum, prev) => sum + prev.value, 0)
    return { ...seg, length: (seg.value / total) * circumference, offset: (before / total) * circumference }
  })

  return (
    <div className={s['donut-wrap']}>
      <div className={s.donut}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#eef1f7" strokeWidth="11" />
          {arcs.filter((arc) => arc.value > 0).map(({ label, color, length, offset }) => (
            <circle key={label} cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="11"
              strokeDasharray={`${Math.max(length - 1.5, 0)} ${circumference}`} strokeDashoffset={-offset} />
          ))}
        </svg>
        <p className={s['donut-center']}><strong>{center.value}</strong><span>{center.label}</span></p>
      </div>
      <ul className={s['donut-legend']}>
        {segments.map(({ label, value, color }) => (
          <li key={label}><span className={s.swatch} style={{ background: color }} />{label}<b>{value}</b></li>
        ))}
      </ul>
      {footer}
    </div>
  )
}
