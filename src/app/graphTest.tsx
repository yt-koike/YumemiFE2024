"use client";
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useRef } from 'react';

export default function GraphTest(props: HighchartsReact.Props) {
  fetch("https://opendata.resas-portal.go.jp/api/v1/prefectures", {
    headers: { "X-API-KEY":"aqBhR8GicxLJwRPXplAiIxZLjkcPghmL49xBDkrX" },
  }).then((response) => response.text()).then((json) => console.log(json));
  const options: Highcharts.Options = {
    title: {
      text: 'My chart'
    },
    series: [{
      type: 'line',
      data: [1, 2, 3]
    }]
  }

  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      ref={chartComponentRef}
      {...props} />
  )
}
