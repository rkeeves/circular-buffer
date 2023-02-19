import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-circular-buffer',
  templateUrl: './circular-buffer.component.html',
  styleUrls: ['./circular-buffer.component.css'],
})
export class CircularBufferComponent {
  inp: number = 0;
  outp: number = 0;
  next: number = 0;
  @Input() capacity!: number;
  nums!: number[];

  ngOnInit() {
    this.nums = Array(this.capacity + 1).fill(-1);
  }

  put() {
    const val = this.next++;
    this.nums[this.inp++] = val;
    this.inp %= this.nums.length;
  }

  get() {
    const item = this.nums[this.outp++];
    this.outp %= this.nums.length;
    return item;
  }

  getSize() {
    return Math.abs(this.inp - this.outp) % this.nums.length;
  }
}
