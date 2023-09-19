export default class Tooltip {
  constructor() {
    this._popovers = [];
  }

  showPopover(message, elem) {
    const popover = document.createElement('div');
    popover.classList.add('tooltip');
    popover.innerHTML = `
        <div class="tooltip_title"></div>
        <div class="tooltip_content"></div>
        `;
    popover.querySelector('.tooltip_title').innerText = message.title;
    popover.querySelector('.tooltip_content').innerText = message.content;

    this._popovers.push({
      elem,
      popover,
    });

    document.body.appendChild(popover);

    const { left, top } = elem.getBoundingClientRect();
    popover.style.left = `${left + elem.offsetWidth / 2 - popover.offsetWidth / 2}px`;
    popover.style.top = `${top - popover.offsetHeight - 10}px`;

    elem.classList.add('border-red')

    
  }

  removePopover(elem) {
    const popover = this._popovers.find((pop) => pop.elem === elem);
    if(popover){
      popover.popover.remove();  
      this._popovers = this._popovers.filter((pop) => pop.elem !== elem);  
      elem.classList.remove('border-red')
    }
  }

  addPopovertoggle(message, elem) {
    elem.addEventListener('click', () => {
      const popover = this._popovers.find((pop) => pop.elem === elem);
      if (popover) { this.removePopover(elem); } else { this.showPopover(message, elem); }
    });
  }
}
