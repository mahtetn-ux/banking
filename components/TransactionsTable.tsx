import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { transactionCategoryStyles } from "@/constants";
import {
  cn,
  formatAmount,
  formatDateTime,
  getTransactionStatus,
  removeSpecialCharacters,
} from "@/lib/utils";

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const {
    borderColor,
    backgroundColor,
    textColor,
    chipBackgroundColor,
   } =
     transactionCategoryStyles[
       category as keyof typeof transactionCategoryStyles
     ] || transactionCategoryStyles.default;

   return (
     <div className={cn("category-badge", borderColor, chipBackgroundColor)}>
       <div className={cn("size-2 shrink-0 rounded-full", backgroundColor)} />
       <p className={cn("truncate text-xs font-medium", textColor)}>{category}</p>
     </div>
   );
};

const TransactionsTable = ({ transactions }: TransactionTableProps) => {
   return (
     <Table>
       <TableHeader className="bg-gray-25">
         <TableRow>
           <TableHead className="px-4">Transaction</TableHead>
           <TableHead className="px-4">Amount</TableHead>
           <TableHead className="px-4">Status</TableHead>
           <TableHead className="px-4">Date</TableHead>
           <TableHead className="px-4">Channel</TableHead>
           <TableHead className="px-4">Category</TableHead>
         </TableRow>
       </TableHeader>
       <TableBody>
         {transactions.map((t: Transaction) => {
           const status = getTransactionStatus(new Date(t.date));
           const amount = formatAmount(t.amount);

           const isDebit = t.type === 'debit';

           return (
             <TableRow
               key={t.id}
               className="border-gray-100 bg-white hover:bg-gray-25"
             >
               <TableCell className="max-w-[240px] px-4 py-3.5">
                 <div className="flex items-center gap-3">
                   <h1 className="truncate text-sm font-semibold text-gray-700">
                     {removeSpecialCharacters(t.name)}
                   </h1>
                 </div>
               </TableCell>

               <TableCell
                 className={cn(
                   "px-4 py-3.5 font-semibold tabular-nums",
                   isDebit || amount[0] === "-"
                     ? "text-red-600"
                     : "text-success-600",
                 )}
               >
                 {isDebit ? `-${amount}` : amount}
              </TableCell>

               <TableCell className="px-4 py-3.5">
                 <CategoryBadge category={status} />
              </TableCell>

               <TableCell className="min-w-36 px-4 py-3.5 text-gray-600">
                 {formatDateTime(new Date(t.date)).dateTime}
              </TableCell>

               <TableCell className="min-w-28 px-4 py-3.5 capitalize text-gray-600">
                 {t.paymentChannel}
               </TableCell>

               <TableCell className="px-4 py-3.5">
                 <CategoryBadge category={t.category} />
               </TableCell>
             </TableRow>
           );
         })}
       </TableBody>
     </Table>
   );
};

export default TransactionsTable;