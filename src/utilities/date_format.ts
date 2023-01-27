export default function toShortFormat(date: Date): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr",
                      "May", "Jun", "Jul", "Aug",
                      "Sep", "Oct", "Nov", "Dec"];
  
  const day = date.getDate();
  
  const monthIndex = date.getMonth();
  const monthName = monthNames[monthIndex];
  
  const year = date.getFullYear();
  
  return `${day} ${monthName} ${year}`;  
}
