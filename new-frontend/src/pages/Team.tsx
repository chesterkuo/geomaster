import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Users, UserPlus, Shield, Settings, Mail, Calendar, Loader2, Eye, Trash2, Send, RotateCcw, X, Search, Filter, Lock, User } from "lucide-react";
import { teamApi, TeamMember, Role, Invitation, ActivityLog } from "@/lib/api/team";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";

const Team = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // Pagination states
  const [membersPage, setMembersPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  
  // Filter states
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("");
  const [invitationStatusFilter, setInvitationStatusFilter] = useState("");
  const [activityActionFilter, setActivityActionFilter] = useState("");
  
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "editor" as "owner" | "admin" | "editor" | "viewer",
    message: ""
  });

  // Load data
  useEffect(() => {
    if (isAuthenticated) {
      loadRoles();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === "members") loadMembers();
    else if (activeTab === "invitations") loadInvitations();
    else if (activeTab === "activity") loadActivities();
  }, [activeTab, membersPage, invitationsPage, activitiesPage, memberSearch, memberRoleFilter, invitationStatusFilter, activityActionFilter]);

  const loadRoles = async () => {
    try {
      if (!isAuthenticated) {
        setRoles([]);
        return;
      }
      
      const response = await teamApi.getRoles();
      if (response.success && response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
      }
    } catch (error: any) {
      setRoles([]); // Ensure roles is always an array even on error
      // Don't show error toast for 401 (unauthorized) errors to avoid console spam
      if (error.response?.status !== 401) {
        toast.error('獲取角色失敗', {
          description: error.response?.data?.message || error.message
        });
      }
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        setMembers([]);
        setLoading(false);
        return;
      }
      
      const response = await teamApi.getMembers({
        page: membersPage,
        limit: 10,
        search: memberSearch || undefined,
        role: memberRoleFilter || undefined
      });
      if (response.success) {
        setMembers(response.data.members);
      }
    } catch (error: any) {
      // Don't show error toast for 401 (unauthorized) errors to avoid console spam
      if (error.response?.status !== 401) {
        toast.error('獲取團隊成員失敗', {
          description: error.response?.data?.message || error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        setInvitations([]);
        setLoading(false);
        return;
      }
      
      const response = await teamApi.getInvitations({
        page: invitationsPage,
        limit: 10,
        status: invitationStatusFilter || undefined
      });
      if (response.success) {
        setInvitations(response.data.invitations);
      }
    } catch (error: any) {
      // Don't show error toast for 401 (unauthorized) errors to avoid console spam
      if (error.response?.status !== 401) {
        toast.error('獲取邀請列表失敗', {
          description: error.response?.data?.message || error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        setActivities([]);
        setLoading(false);
        return;
      }
      
      const response = await teamApi.getActivity({
        page: activitiesPage,
        limit: 20,
        action: activityActionFilter || undefined
      });
      if (response.success) {
        setActivities(response.data.activities);
      }
    } catch (error: any) {
      // Don't show error toast for 401 (unauthorized) errors to avoid console spam
      if (error.response?.status !== 401) {
        toast.error('獲取活動記錄失敗', {
          description: error.response?.data?.message || error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteData.email || !inviteData.role) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    try {
      const response = await teamApi.sendInvitation(inviteData);
      if (response.success) {
        toast.success('邀請已發送');
        setInviteDialogOpen(false);
        setInviteData({ email: "", role: "editor", message: "" });
        if (activeTab === "invitations") loadInvitations();
      }
    } catch (error: any) {
      toast.error('發送邀請失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleResendInvitation = async (id: number) => {
    try {
      const response = await teamApi.resendInvitation(id);
      if (response.success) {
        toast.success('邀請已重新發送');
        loadInvitations();
      }
    } catch (error: any) {
      toast.error('重新發送邀請失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleCancelInvitation = async (id: number) => {
    try {
      const response = await teamApi.cancelInvitation(id);
      if (response.success) {
        toast.success('邀請已取消');
        loadInvitations();
      }
    } catch (error: any) {
      toast.error('取消邀請失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleUpdateMember = async (id: string, updates: { role?: string; status?: string }) => {
    try {
      const response = await teamApi.updateMember(id, updates);
      if (response.success) {
        toast.success('成員資訊已更新');
        loadMembers();
      }
    } catch (error: any) {
      toast.error('更新成員失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      const response = await teamApi.removeMember(id);
      if (response.success) {
        toast.success('成員已移除');
        loadMembers();
      }
    } catch (error: any) {
      toast.error('移除成員失敗', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    if (!roles || !Array.isArray(roles)) return roleName;
    const role = roles.find(r => r.name === roleName);
    return role?.displayName || roleName;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive"; text: string }> = {
      'active': { variant: "default", text: "活躍" },
      'inactive': { variant: "secondary", text: "非活躍" },
      'suspended': { variant: "destructive", text: "已暫停" },
      'pending': { variant: "default", text: "待接受" },
      'accepted': { variant: "default", text: "已接受" },
      'expired': { variant: "destructive", text: "已過期" },
      'cancelled': { variant: "secondary", text: "已取消" }
    };
    const config = statusMap[status] || { variant: "secondary" as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">團隊管理</h1>
          <p className="text-muted-foreground">管理團隊成員和權限設定</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">團隊成員</TabsTrigger>
            <TabsTrigger value="roles">角色權限</TabsTrigger>
            <TabsTrigger value="invitations">邀請管理</TabsTrigger>
            <TabsTrigger value="activity">活動記錄</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">團隊成員 ({members.length})</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜尋成員..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9 w-full sm:w-48"
                    />
                  </div>
                  <Select value={memberRoleFilter} onValueChange={setMemberRoleFilter}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部角色</SelectItem>
                      {roles && roles.length > 0 && roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      邀請成員
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>邀請新成員</DialogTitle>
                      <DialogDescription>
                        邀請新成員加入您的組織
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email 地址</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteData.email}
                          onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">角色</Label>
                        <Select value={inviteData.role} onValueChange={(value: any) => setInviteData({ ...inviteData, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles && roles.length > 0 && roles.map((role) => (
                              <SelectItem key={role.name} value={role.name}>
                                {role.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">邀請訊息 (選填)</Label>
                        <Textarea
                          id="message"
                          value={inviteData.message}
                          onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                          placeholder="歡迎加入我們的團隊！"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSendInvitation}>
                        <Send className="h-4 w-4 mr-2" />
                        發送邀請
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理團隊成員</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可查看團隊成員、發送邀請和管理權限</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {members.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{member.fullName}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              上次登入: {member.lastLogin ? formatDate(member.lastLogin) : '從未登入'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(member.status)}
                          <Badge variant="outline">{getRoleDisplayName(member.role)}</Badge>
                          <Select 
                            value={member.role} 
                            onValueChange={(value) => handleUpdateMember(member.id, { role: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles && roles.length > 0 && roles.map((role) => (
                                <SelectItem key={role.name} value={role.name}>
                                  {role.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>確認移除成員</AlertDialogTitle>
                                <AlertDialogDescription>
                                  您確定要移除 {member.fullName} 嗎？此操作無法復原。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                                  移除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看角色權限</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可查看組織內不同角色的權限設定和管理範圍</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">角色與權限</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roles && roles.length > 0 ? roles.map((role) => (
                    <Card key={role.name}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {role.displayName}
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">權限包含:</h4>
                          <div className="space-y-1">
                            {role.permissions && Array.isArray(role.permissions) ? role.permissions.map((permission, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {permission}
                              </div>
                            )) : (
                              <div className="text-sm text-muted-foreground">
                                • 沒有權限資訊
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>沒有可用的角色</p>
                      {!isAuthenticated && <p className="text-sm">請先登入查看角色</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">邀請管理</h2>
              <Select value={invitationStatusFilter} onValueChange={setInvitationStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="pending">待接受</SelectItem>
                  <SelectItem value="accepted">已接受</SelectItem>
                  <SelectItem value="expired">已過期</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能管理邀請</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可發送邀請、重新發送邀請和查看邀請狀態</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>邀請列表</CardTitle>
                  <CardDescription>管理發送給新成員的邀請</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">{invitation.email}</div>
                          <div className="text-sm text-muted-foreground">
                            角色: {getRoleDisplayName(invitation.role)} • 發送日期: {formatDate(invitation.createdAt)}
                          </div>
                          {invitation.message && (
                            <div className="text-sm text-muted-foreground mt-1">
                              訊息: {invitation.message}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(invitation.status)}
                          {invitation.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleResendInvitation(invitation.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                重新發送
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                取消
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {invitations.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        沒有找到邀請記錄
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">活動記錄</h2>
              <Input
                placeholder="搜尋動作..."
                value={activityActionFilter}
                onChange={(e) => setActivityActionFilter(e.target.value)}
                className="w-48"
              />
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">需要登入才能查看活動記錄</p>
                  <p className="text-sm text-muted-foreground mb-6">登入後即可查看團隊成員的操作記錄和活動歷史</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      立即登入
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    團隊活動記錄
                  </CardTitle>
                  <CardDescription>查看團隊成員的操作記錄</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {activity.user?.fullName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {activity.user?.fullName || '系統'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {activity.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        沒有找到活動記錄
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Reload data after login based on current tab
          if (activeTab === "members") loadMembers();
          else if (activeTab === "invitations") loadInvitations();
          else if (activeTab === "activity") loadActivities();
        }}
      />
    </DashboardLayout>
  );
};

export default Team;