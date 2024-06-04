import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

type Population = {
  label: string;
  data: {
    year: number;
    value: number;
    rate: number | undefined;
  }[];
};

type PopulationRecord = {
  boundaryYear: number;
  data: Population[];
};

type Prefecture = {
  prefCode: number;
  prefName: string;
};
function gcd2(a: number, b: number): number {
  // a と b の最大公倍数(Greatest Common Divisor)を返す
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

export function gcd(xs: number[]): number {
  // xs 内全ての整数に関する最大公倍数(Greatest Common Divisor)を返す
  // 空配列なら 1 を返す
  if (xs.length == 0) return 1;
  if (xs.length == 1) return xs[0];
  if (xs.length == 2) return gcd2(xs[0], xs[1]);
  return gcd([gcd2(xs[0], xs[1])].concat(xs.slice(2)));
}

type GraphLine = {
  // 折れ線グラフの描画に必要な情報
  name: string;
  xyList: { x: number; y: number }[];
};

function GraphDraw(title: string, yAxisTitle: string, graphLines: GraphLine[]) {
  // 折れ線グラフを描画する
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

async function fetchPrefectures(apiKey: string) {
  // 人口データを取得する
  const response = await fetch(
    "https://opendata.resas-portal.go.jp/api/v1/prefectures",
    { headers: { "X-API-KEY": apiKey } }
  );
  if (response.status != 200) {
    throw new Error("fetchPrefectures() couldn't fetch prefectures");
  }
  const prefectures = await response.json().then((json) => json.result);
  return prefectures;
}

async function fetchPopulation(apiKey: string, prefCode: number) {
  // 人口データを取得する
  const response = await fetch(
    "https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?cityCode=-&prefCode=" +
      prefCode.toString(),
    { headers: { "X-API-KEY": apiKey } }
  );
  if (response.status != 200) {
    throw new Error("fetchPopulation() couldn't fetch population");
  }
  const population = await response.json().then((json) => json.result);
  return population;
}

export function widthTable(w: number, items: JSX.Element[]): JSX.Element[] {
  // 列が w 個ある表内に items を並べる
  // 並べ順: 1 行目を左から埋めていき，w 個並べたら次の行に進む
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
    // 都道府県名を取得
    fetchPrefectures(apiKey)
      .then((prefectures) => {
        if (prefectures != undefined && prefectures.length > 0) {
          setPrefectures(prefectures);
          setIsLoaded(true);
        }
      })
      .catch((e) => {
        console.log(e);
        setIsLoaded(false);
      });
  }, [apiKey]);

  useEffect(() => {
    // チェックボックスを全て非選択状態にする
    setChecked(prefectures.map((_) => false));
    // 人口データを取得する．
    const newPopRecords = Array<PopulationRecord>(prefectures.length);
    prefectures.map((pref, idx) =>
      fetchPopulation(apiKey, pref.prefCode).then((pop) => {
        newPopRecords[idx] = pop;
      })
    );
    setPopRecord(newPopRecords);
  }, [apiKey, prefectures]);

  if (!isLoaded) {
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
        <p>API Key を入力してください．</p>
      </div>
    );
  }
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
