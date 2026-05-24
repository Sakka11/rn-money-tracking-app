// ฟังก์ชันจัดการวันที่ตามโซนเวลากรุงเทพ (Asia/Bangkok)

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// วันที่ปัจจุบันโซนกรุงเทพ ในรูปแบบ YYYY-MM-DD
export const bangkokToday = (): string => {
  // en-CA ให้รูปแบบ YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

// แปลง YYYY-MM-DD เป็นข้อความไทย เช่น "1 มกราคม 2568"
export const formatThaiDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);

  if (!year || !month || !day) {
    return dateStr;
  }

  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`;
};

// แปลงตัวเลขเป็นรูปแบบเงิน เช่น 2500 -> "2,500.00"
export const formatMoney = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
