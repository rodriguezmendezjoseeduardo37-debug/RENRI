interface TimeSlotPickerProps {
    slots: { startTime: string; endTime: string; available: boolean }[];
    selectedTime: string | null;
    onSelect: (time: string) => void;
}

export function TimeSlotPicker({
    slots,
    selectedTime,
    onSelect,
}: TimeSlotPickerProps) {
    const availableSlots = slots.filter((s) => s.available);

    if (slots.length === 0) {
        return (
            <div className="border border-[#222222] p-8 text-center">
                <p className="text-sm font-mono text-[#666666]">
                    No hay horarios disponibles para esta fecha.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => (
                <button
                    key={slot.startTime}
                    onClick={() => slot.available && onSelect(slot.startTime)}
                    disabled={!slot.available}
                    className={`py-3 px-2 text-center text-sm font-mono font-bold transition-all ${selectedTime === slot.startTime
                            ? "bg-white text-black"
                            : slot.available
                                ? "bg-[#111111] border border-[#222222] text-white hover:border-white"
                                : "bg-[#0a0a0a] text-[#333333] cursor-not-allowed line-through"
                        }`}
                >
                    {slot.startTime}
                </button>
            ))}
            {availableSlots.length === 0 && (
                <p className="col-span-full text-center text-[10px] text-[#888888] mt-2">
                    Todos los horarios están ocupados
                </p>
            )}
        </div>
    );
}
