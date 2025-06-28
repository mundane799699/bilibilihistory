"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Label } from "./ui/label";
import { Membership } from "@/lib/db/schema";

type MembershipWithUser = Membership & {
  userName: string | null;
  userImage: string | null;
};

const formSchema = z.object({
  email: z.string().email("无效的邮箱地址"),
  plan: z.string().optional(),
  status: z.enum(["active", "expired", "cancelled"]).default("active"),
  expiresAt: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export default function MembershipsManager() {
  const [memberships, setMemberships] = useState<MembershipWithUser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMembership, setEditingMembership] =
    useState<MembershipWithUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const fetchMemberships = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/memberships?${params.toString()}`);
      if (!response.ok) {
        throw new Error("获取会员列表失败");
      }
      const data = await response.json();
      setMemberships(data.data);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [pagination.page, debouncedSearchTerm, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const onSubmit = async (data: FormData) => {
    const apiEndpoint = editingMembership
      ? `/api/memberships/${editingMembership.id}`
      : "/api/memberships";
    const method = editingMembership ? "PUT" : "POST";

    const payload = { ...data, expiresAt: data.expiresAt?.toISOString() };

    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            (editingMembership ? "更新会员失败" : "创建会员失败")
        );
      }

      toast.success(`会员${editingMembership ? "更新" : "创建"}成功!`);
      setIsDialogOpen(false);
      setEditingMembership(null);
      fetchMemberships(); // Refresh data
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openDialog = (membership: MembershipWithUser | null = null) => {
    setEditingMembership(membership);
    if (membership) {
      const resetValues: any = {
        ...membership,
        expiresAt: membership.expiresAt ? new Date(membership.expiresAt) : null,
      };
      reset(resetValues);
    } else {
      reset({
        email: "",
        plan: "monthly",
        status: "active",
        expiresAt: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个会员吗？")) return;

    try {
      const response = await fetch(`/api/memberships/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "删除会员失败");
      }
      toast.success("会员删除成功!");
      fetchMemberships(); // Refresh data
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="按姓名或邮箱搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:w-[300px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="按状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="active">有效</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          添加会员
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>套餐</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>到期日</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : memberships.length > 0 ? (
              memberships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={m.userImage || ""} />
                        <AvatarFallback>{m.userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{m.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {m.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{m.plan || "N/A"}</TableCell>
                  <TableCell>{m.status}</TableCell>
                  <TableCell>
                    {m.expiresAt
                      ? format(new Date(m.expiresAt), "yyyy-MM-dd")
                      : "永久"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(m.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(m)}>
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(m.id)}
                          className="text-red-600"
                        >
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  未找到会员记录。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(pagination.page - 1);
              }}
              className={
                pagination.page <= 1
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i + 1);
                }}
                isActive={pagination.page === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(pagination.page + 1);
              }}
              className={
                pagination.page >= pagination.totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMembership ? "编辑会员" : "添加新会员"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                {...register("email")}
                disabled={!!editingMembership}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="plan">套餐</Label>
              <Input id="plan" {...register("plan")} />
            </div>
            <div>
              <Label htmlFor="status">状态</Label>
              <Select
                onValueChange={(value) => setValue("status", value as any)}
                defaultValue={editingMembership?.status || "active"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">有效</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiresAt">到期日</Label>
              <Input
                type="date"
                id="expiresAt"
                {...register("expiresAt", {
                  setValueAs: (value) => (value ? new Date(value) : null),
                })}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  取消
                </Button>
              </DialogClose>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
