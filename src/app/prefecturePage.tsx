import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Prefecture, pop, PopulationRecord, prefecturesData } from "./prefData";

function gcd2(a: number, b: number): number {
  if (a == 0 || b == 0) return 1;
  if (a < 0) a = -a;
  if (b < 0) b = -b;
  if (a < b) {
    var tmp = a;
    a = b;
    b = tmp;
  }
  if (a % b == 0) return b;
  return gcd2(b, a % b);
}

function gcd(xs: number[]): number {
  if (xs.length == 0) return 1;
  if (xs.length == 1) return xs[0];
  if (xs.length == 2) return gcd2(xs[0], xs[1]);
  return gcd([gcd2(xs[0], xs[1])].concat(xs.slice(2)));
}

type GraphLine = {
  name: string;
  xyList: { x: number; y: number }[];
};

function GraphDraw(title: string, yAxisTitle: string, graphLines: GraphLine[]) {
  const xTickInterval = gcd(
    graphLines.map((graphLine) => gcd(graphLine.xyList.map((xy) => xy.x)))
  );
  const seriesBunch = graphLines.map((graphLine) => {
    const series = {
      type: "line",
      name: graphLine.name,
      data: graphLine.xyList,
    } as Highcharts.SeriesOptionsType;
    return series;
  });
  const options: Highcharts.Options = {
    title: {
      text: title,
    },
    series: seriesBunch,
    xAxis: {
      tickInterval: xTickInterval,
    },
    yAxis: {
      title: yAxisTitle,
    } as Highcharts.YAxisOptions,
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

async function fetchPopulation(apiKey: string, prefCode: number) {
  const response = await fetch(
    "https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?cityCode=-&prefCode=" +
      prefCode.toString(),
    { headers: { "X-API-KEY": apiKey } }
  );
  const population = await response.json().then((json) => json.result);
  return population;
}

function widthTable(w: number, items: JSX.Element[]): JSX.Element[] {
  const h = Math.ceil(items.length / w);
  const li = [];
  var key = 0;
  for (var i = 0; i < h; i++) {
    const row = [];
    for (var j = 0; j < w; j++) {
      if (j + i * w >= items.length) break;
      row.push(<td key={key++}>{items[j + i * w]}</td>);
    }
    li.push(<tr key={key++}>{row}</tr>);
  }
  return li;
}

export function PrefecturePage() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [isCheckedAry, setChecked] = useState<boolean[]>([]);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [popRecords, setPopRecord] = useState<PopulationRecord[]>([]);
  function InputBox(id: number, isChecked: boolean, title: string) {
    return (
      <div>
        <input
          type="checkbox"
          value={id}
          checked={isChecked}
          onChange={(_) => {
            setChecked(isCheckedAry.map((c, i) => (id == i ? !c : c)));
          }}
        ></input>
        {title}
      </div>
    );
  }

  useEffect(() => {
    if (apiKey === "") {
      setPrefectures(prefecturesData);
      setPopRecord(pop);
      setChecked(prefecturesData.map((_) => false));
      setIsLoaded(true);
      return;
    }
    fetch("https://opendata.resas-portal.go.jp/api/v1/prefectures", {
      headers: {
        "X-API-KEY": apiKey,
      },
    })
      .then((response) => response.json())
      .then((json) => {
        setPrefectures(json.result);
        setIsLoaded(true);
      })
      .catch((e) => {
        alert(e);
        setIsLoaded(false);
      });
  }, [apiKey]);

  useEffect(() => {
    if (prefectures == undefined) return;
    setChecked(prefectures.map((_) => false));
    prefectures.map((pref, idx) =>
      fetchPopulation(apiKey, pref.prefCode).then((pop) => {
        setPopRecord((popRecord) => {
          const newPopRecord = [...popRecord];
          newPopRecord[idx] = pop;
          return newPopRecord;
        });
      })
    );
  }, [apiKey, prefectures]);

  if (prefectures == undefined || prefectures.length == 0 || !isLoaded)
    return (
      <div>
        <p>
          ApiKey:
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          ></input>
        </p>
        <p>読み込みに失敗しました．正しい API Key を入力してください．</p>
      </div>
    );
  const selectedPrefectures = prefectures.filter((p, i) => isCheckedAry[i]);
  const selectedPopRecords = popRecords.filter((p, i) => isCheckedAry[i]);
  const graphLines = selectedPrefectures.map(
    (p, i) =>
      ({
        name: p.prefName,
        xyList: selectedPopRecords[i].data[0].data.map((d) => ({
          x: d.year,
          y: d.value,
        })),
      } as GraphLine)
  );
  return (
    <div>
      <p>
        ApiKey:
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        ></input>
      </p>
      <table>
        <tbody>
          {widthTable(
            5,
            prefectures.map((p, i) =>
              InputBox(i, isCheckedAry[i] ?? false, p.prefName ?? "")
            )
          )}
        </tbody>
      </table>
      {GraphDraw("総人口", "人口", graphLines)}
    </div>
  );
}
