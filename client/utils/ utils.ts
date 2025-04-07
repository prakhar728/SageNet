export const inferStatus = (status: number) => {
  switch (status) {
    case 0:
      return "Draft";
    case 1:
      return "Submitted";
    case 2:
      return "In Review";
    case 3:
      return "Published";
    default:
      return "";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Published":
    case "Accepted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "In Review":
    case "Under Review":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "Draft":
    case "Submitted":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    default:
      return "";
  }
};

export function timestampToLocalDateTime(timestamp: number): string {
  // If the timestamp is in seconds, convert to milliseconds
  if (timestamp.toString().length === 10) {
    timestamp *= 1000;
  }

  const date = new Date(timestamp);
  return date.toLocaleString(); // Converts to local date and time
}
