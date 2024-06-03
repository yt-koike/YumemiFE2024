import {
  ChangeEvent,
  ChangeEventHandler,
  Component,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Prefecture, pop, PopulationRecord, prefecturesData } from "./prefData";
require("dotenv").config();

const apiKey = process.env.RESAS_API_KEY;
class CheckBox {
  id: number;
  title: string;
  isChecked: boolean;
  handler: (arg0: ChangeEvent<HTMLInputElement>) => void;
  constructor(
    id: number,
    title: string,
    isChecked: boolean,
    handler: (arg0: ChangeEvent<HTMLInputElement>) => void = (e) => isChecked
  ) {
    this.id = id;
    this.title = title;
    this.isChecked = isChecked;
    this.handler = handler;
  }
  render() {
    return (
      <>
        <input
          type="checkbox"
          value={this.id}
          checked={this.isChecked}
          onChange={(e) => this.handler(e)}
        ></input>{" "}
        {this.title}
      </>
    );
  }
}

class CheckBoxMan {
  private nextId: number = 0;
  checkBoxes: CheckBox[];
  setCheckBoxes: Dispatch<SetStateAction<CheckBox[]>>;
  constructor(
    checkBoxes: CheckBox[],
    setCheckBoxes: Dispatch<SetStateAction<CheckBox[]>>
  ) {
    this.checkBoxes = checkBoxes;
    this.setCheckBoxes = setCheckBoxes;
  }
  newCheckBox(
    title: string,
    isChecked: boolean,
    handler: (arg0: ChangeEvent<HTMLInputElement>) => void
  ) {
    this.setCheckBoxes([
      ...this.checkBoxes,
      new CheckBox(this.nextId++, title, isChecked, handler),
    ]);
  }
  searchByTitle(title: string) {
    return this.checkBoxes.filter((c) => c.title === title);
  }
  flipChecked(id: number) {
    this.setCheckBoxes(
      this.checkBoxes.map((c) =>
        c.id == id ? new CheckBox(c.id, c.title, !c.isChecked, c.handler) : c
      )
    );
  }
  render() {
    return (
      <ul>
        {this.checkBoxes.map((c, i) => (
          <li key={i}>{c.render()}</li>
        ))}
      </ul>
    );
  }
}

function lcd2(a: number, b: number): number {
  if (a == 0 || b == 0) return 1;
  if (a < 0) a = -a;
  if (b < 0) b = -b;
  if (a < b) {
    var tmp = a;
    a = b;
    b = tmp;
  }
  if (a % b == 0) return b;
  return lcd2(b, a % b);
}

function lcd(xs: number[]): number {
  if (xs.length == 0) return 1;
  if (xs.length == 1) return xs[0];
  if (xs.length == 2) return lcd2(xs[0], xs[1]);
  return lcd([lcd2(xs[0], xs[1])].concat(xs.slice(2)));
}

function GraphDraw(
  title: string,
  yAxisTitle: string,
  popRecord: PopulationRecord
) {
  const pop = popRecord.data;
  const series = pop.map((p) => {
    return {
      type: "line",
      name: p.label,
      data: p.data.map((x) => [x.year, x.value]),
    } as Highcharts.SeriesOptionsType;
  });
  const options: Highcharts.Options = {
    title: {
      text: title,
    },
    series: series,
    xAxis: {
      tickInterval: lcd(pop[0].data.map((x) => x.year)),
    },
    yAxis: {
      title: yAxisTitle,
    } as Highcharts.YAxisOptions,
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

function View(
  isCheckedAry: boolean[],
  setChecked: Dispatch<SetStateAction<boolean[]>>,
  prefectures: Prefecture[],
  popRecord: PopulationRecord[]
) {}

async function fetchPopulation(prefCode: number) {
  const response = await fetch(
    "https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?cityCode=-&prefCode=" +
      prefCode.toString(),
    { headers: { "X-API-KEY": apiKey} }
  )
  const population = await response.json().then((json) => json.result);
  return population;
}

export function PrefecturePage() {
  const [isCheckedAry, setChecked] = useState<boolean[]>([]);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [popRecord, setPopRecord] = useState<(PopulationRecord | undefined)[]>(
    []
  );
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
  function widthTable(w: number, items: []) {
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

  useEffect(() => {
    if (apiKey == undefined) {
      setPrefectures(prefecturesData);
      setPopRecord(pop);
      setChecked(prefecturesData.map((_) => false));
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
      })
      .catch((e) => alert(e));
   
  }, []);
  useEffect(() => {
    setChecked(prefectures.map((_) => false));
    prefectures.map((pref,idx)=>
      fetchPopulation(pref.prefCode).then((pop) => {
        setPopRecord((popRecord) => {
          const newPopRecord = [...popRecord];
          newPopRecord[idx] = pop;
          return newPopRecord;
        });
      }));
    /*
    setPopRecord(prefectures.map((_) => undefined));
    function fetchAllPopulation(prefCodes: number[]) {
      console.log(prefCodes);
      var popRecords: Array<any> = [];
      Promise.all(
        prefCodes.map((prefCode) =>
          fetch(
            "https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?prefCode=" +
              prefCode.toString(),
            { headers: { "X-API-KEY": process.env.REACT_API_KEY } }
          )
        )
      )
        .then((response) => response.map((r) => console.log(r.json())))
        .catch(alert);
      return popRecords;
    }
    const prefCodes = prefectures.map((p) => p.prefCode);
    fetchAllPopulation(prefCodes);
    */
  }, [prefectures]);

  if (prefectures == undefined || prefectures.length == 0) return <></>;
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
      <p>Hello!{isCheckedAry.map((c, i) => c && prefectures[i].prefName)}</p>
      {isCheckedAry.map((c,i)=>(c && popRecord[i] != undefined)? GraphDraw(prefectures[i].prefName, "人口", popRecord[i]):<></>)}
    </div>
  );
}
