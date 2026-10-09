<script>
  import { ICONS } from '../../lib/icons';

  export let name;
  export let size = 16;
  export let strokeWidth = 2;
  let className = '';
  export { className as class };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class="shrink-0 {className}"
  aria-hidden="true"
>{@html ICONS[name] || ''}</svg>
