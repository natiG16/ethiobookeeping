import {
  patchEthiopianDatePickerInteraction,
  patchEthiopianDatePickerLibrary,
  patchEthiopianDatePickerPosition,
} from './app/core/utils/ethiopian-datepicker-patch';

type EthiopianDatePickerCtor = typeof EthiopianDatePicker;

let calendarPatched = false;
let pickerPositionPatched = false;
let pickerInteractionPatched = false;

export async function loadEthiopianDatePicker(): Promise<void> {
  const win = window as unknown as { EthiopianDatePicker?: EthiopianDatePickerCtor };
  if (win.EthiopianDatePicker && calendarPatched && pickerPositionPatched && pickerInteractionPatched) {
    return;
  }

  const mod = (await import('@bekim_2121/ethiopian-datepicker/dist/ethiopian-datepicker.js')) as {
    EthiopianDatePicker?: EthiopianDatePickerCtor;
    EthiopianCalendar?: Parameters<typeof patchEthiopianDatePickerLibrary>[0];
    default?: {
      EthiopianDatePicker?: EthiopianDatePickerCtor;
      EthiopianCalendar?: Parameters<typeof patchEthiopianDatePickerLibrary>[0];
    };
  };

  const Calendar = mod.EthiopianCalendar ?? mod.default?.EthiopianCalendar;
  if (Calendar && !calendarPatched) {
    patchEthiopianDatePickerLibrary(Calendar);
    calendarPatched = true;
  }

  const Ctor = mod.EthiopianDatePicker ?? mod.default?.EthiopianDatePicker;
  if (Ctor) {
    if (!pickerInteractionPatched) {
      patchEthiopianDatePickerInteraction(Ctor as never);
      pickerInteractionPatched = true;
    }
    if (!pickerPositionPatched) {
      patchEthiopianDatePickerPosition(
        Ctor as unknown as { prototype: import('./app/core/utils/ethiopian-datepicker-patch').DatePickerInstance }
      );
      pickerPositionPatched = true;
    }
    win.EthiopianDatePicker = Ctor;
    return;
  }

  console.error('Could not load EthiopianDatePicker from @bekim_2121/ethiopian-datepicker');
}
