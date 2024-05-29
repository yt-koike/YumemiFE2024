
'use client';
import { Dispatch, SetStateAction, useState } from "react";

class CheckBox {
  value: string;
  title: string;
  isChecked: boolean;
  setChecked: Dispatch<SetStateAction<boolean>>;
  handler: () => void;
  constructor(value: string = "") {
    this.value = value;
    const [title, setTitle] = useState("");
    this.title = title;
    const [isChecked, setChecked] = useState(false);
    this.isChecked = isChecked;
    this.setChecked = setChecked;
    this.handler = () => {setTitle("pushed")};
  }
  getTitle(title:string){
   return  this.title;
  }
  setTitle(title:string){
    this.title=title;
  }
  toHtml() {
    return (<><input type="checkbox" checked={this.isChecked} onChange={(e)=>{this.setChecked(!this.isChecked);this.handler();}}></input>{this.title}</>);
  }
}

class CheckBoxGrid {
  w: number;
  h: number;
  checkBoxes: CheckBox[];
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.checkBoxes = [];
    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        this.checkBoxes.push(new CheckBox("1"));
      }
    }
  }
  get(i: number, j: number): CheckBox {
    return this.checkBoxes[i * this.w + j];
  }
  set(i: number, j: number, checkBox: CheckBox): void {
    this.checkBoxes[i * this.w + j] = checkBox;
  }
  toHtml(): JSX.Element {
    var tr = [];
    for (var i = 0; i < this.h; i++) {
      var td = [];
      for (var j = 0; j < this.w; j++) {
        td.push(<td>{this.checkBoxes[i * this.w + j].toHtml()}</td>);
      }
      tr.push((<tr>{td}</tr>));
    }
    return (
      <table>
        <tbody>
         {tr}
        </tbody>
      </table>
    );
  }
}

export default function Home() {
  const checkBoxGrid = new CheckBoxGrid(5, 5);
  console.log(1);
  return <div>{checkBoxGrid.toHtml()}</div>;
}
