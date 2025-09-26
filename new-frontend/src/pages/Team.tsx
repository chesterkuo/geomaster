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
import { useTranslation } from "react-i18next";

const Team = () => {
  const { t } = useTranslation();
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
        toast.error(t('team.messages.getRolesFailed'), {
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
        toast.error(t('team.messages.getMembersFailed'), {
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
        toast.error(t('team.messages.getInvitationsFailed'), {
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
        toast.error(t('team.messages.getActivitiesFailed'), {
          description: error.response?.data?.message || error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteData.email || !inviteData.role) {
      toast.error(t('team.messages.fillAllRequired'));
      return;
    }

    try {
      const response = await teamApi.sendInvitation(inviteData);
      if (response.success) {
        toast.success(t('team.messages.invitationSent'));
        setInviteDialogOpen(false);
        setInviteData({ email: "", role: "editor", message: "" });
        if (activeTab === "invitations") loadInvitations();
      }
    } catch (error: any) {
      toast.error(t('team.messages.sendInvitationFailed'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleResendInvitation = async (id: number) => {
    try {
      const response = await teamApi.resendInvitation(id);
      if (response.success) {
        toast.success(t('team.messages.invitationResent'));
        loadInvitations();
      }
    } catch (error: any) {
      toast.error(t('team.messages.resendInvitationFailed'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleCancelInvitation = async (id: number) => {
    try {
      const response = await teamApi.cancelInvitation(id);
      if (response.success) {
        toast.success(t('team.messages.invitationCancelled'));
        loadInvitations();
      }
    } catch (error: any) {
      toast.error(t('team.messages.cancelInvitationFailed'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleUpdateMember = async (id: string, updates: { role?: string; status?: string }) => {
    try {
      const response = await teamApi.updateMember(id, updates);
      if (response.success) {
        toast.success(t('team.messages.memberUpdated'));
        loadMembers();
      }
    } catch (error: any) {
      toast.error(t('team.messages.updateMemberFailed'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      const response = await teamApi.removeMember(id);
      if (response.success) {
        toast.success(t('team.messages.memberRemoved'));
        loadMembers();
      }
    } catch (error: any) {
      toast.error(t('team.messages.removeMemberFailed'), {
        description: error.response?.data?.message || error.message
      });
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    if (!roles || !Array.isArray(roles)) return roleName;
    const role = roles.find(r => r.name === roleName);
    return role?.displayName || roleName;
  };

  const getPermissionDisplayName = (permission: string) => {
    const permissionMap: Record<string, string> = {
      'user.manage': t('team.permissions.userManage'),
      'user.invite': t('team.permissions.userInvite'),
      'settings.manage': t('team.permissions.settingsManage'),
      'billing.manage': t('team.permissions.billingManage'),
      'content.edit': t('team.permissions.contentEdit'),
      'reports.view': t('team.permissions.reportsView'),
      'reports.export': t('team.permissions.reportsExport'),
      'analytics.view': t('team.permissions.analyticsView'),
      'keywords.manage': t('team.permissions.keywordsManage')
    };
    return permissionMap[permission] || permission;
  };

  const getActivityActionDisplayName = (action: string) => {
    // Check if the action has a translation key
    const translationKey = `team.activityActions.${action}`;
    const translated = t(translationKey);

    // If translation exists (not the same as the key), use it, otherwise return the original action
    return translated !== translationKey ? translated : action;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive"; text: string }> = {
      'active': { variant: "default", text: t('team.status.active') },
      'inactive': { variant: "secondary", text: t('team.status.inactive') },
      'suspended': { variant: "destructive", text: t('team.status.suspended') },
      'pending': { variant: "default", text: t('team.status.pending') },
      'accepted': { variant: "default", text: t('team.status.accepted') },
      'expired': { variant: "destructive", text: t('team.status.expired') },
      'cancelled': { variant: "secondary", text: t('team.status.cancelled') }
    };
    const config = statusMap[status] || { variant: "secondary" as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('team.dates.unknownDate');

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('team.dates.invalidDate');

    return date.toLocaleDateString('en-US', {
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
          <h1 className="text-3xl font-bold text-foreground">{t('team.title')}</h1>
          <p className="text-muted-foreground">{t('team.description')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">{t('team.tabs.members')}</TabsTrigger>
            <TabsTrigger value="roles">{t('team.tabs.roles')}</TabsTrigger>
            <TabsTrigger value="invitations">{t('team.tabs.invitations')}</TabsTrigger>
            <TabsTrigger value="activity">{t('team.tabs.activity')}</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">{t('team.members.count', { count: members.length })}</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('team.members.searchPlaceholder')}
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9 w-full sm:w-48"
                    />
                  </div>
                  <Select value={memberRoleFilter} onValueChange={setMemberRoleFilter}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('team.members.roleFilter')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('team.members.allRoles')}</SelectItem>
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
                      {t('team.members.inviteButton')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('team.invite.title')}</DialogTitle>
                      <DialogDescription>
                        {t('team.invite.description')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('team.invite.emailLabel')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteData.email}
                          onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                          placeholder={t('team.invite.emailPlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">{t('team.invite.roleLabel')}</Label>
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
                        <Label htmlFor="message">{t('team.invite.messageLabel')}</Label>
                        <Textarea
                          id="message"
                          value={inviteData.message}
                          onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                          placeholder={t('team.invite.messagePlaceholder')}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleSendInvitation}>
                        <Send className="h-4 w-4 mr-2" />
                        {t('team.invite.sendButton')}
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('team.auth.membersRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('team.auth.membersDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('team.auth.loginButton')}
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
                              {member.lastLogin ? t('team.members.lastLogin', { date: formatDate(member.lastLogin) }) : t('team.members.neverLoggedIn')}
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
                                <AlertDialogTitle>{t('team.members.confirmRemove')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('team.members.confirmRemoveDescription', { name: member.fullName })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                                  {t('team.members.removeMember')}
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('team.auth.rolesRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('team.auth.rolesDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('team.auth.loginButton')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{t('team.roles.title')}</h2>
                  {/* Note: Role creation is typically managed at the system level */}
                  {/* Future implementation could include custom role creation for enterprise plans */}
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
                          <h4 className="text-sm font-medium mb-2">{t('team.roles.permissionsInclude')}</h4>
                          <div className="space-y-1">
                            {role.permissions && Array.isArray(role.permissions) ? role.permissions.map((permission, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {getPermissionDisplayName(permission)}
                              </div>
                            )) : (
                              <div className="text-sm text-muted-foreground">
                                • {t('team.roles.noPermissionInfo')}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('team.roles.noRoles')}</p>
                      {!isAuthenticated && <p className="text-sm">{t('team.roles.loginToViewRoles')}</p>}
                    </div>
                  )}
                </div>

                {/* Role information guide */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {t('team.roles.guide.title')}
                    </CardTitle>
                    <CardDescription>{t('team.roles.guide.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">{t('team.roles.owner')}</Badge>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {t('team.roles.guide.owner')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">{t('team.roles.admin')}</Badge>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {t('team.roles.guide.admin')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">{t('team.roles.editor')}</Badge>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {t('team.roles.guide.editor')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">{t('team.roles.viewer')}</Badge>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {t('team.roles.guide.viewer')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('team.invitations.title')}</h2>
              <Select value={invitationStatusFilter} onValueChange={setInvitationStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('team.invitations.statusFilter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('team.invitations.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('team.status.pending')}</SelectItem>
                  <SelectItem value="accepted">{t('team.status.accepted')}</SelectItem>
                  <SelectItem value="expired">{t('team.status.expired')}</SelectItem>
                  <SelectItem value="cancelled">{t('team.status.cancelled')}</SelectItem>
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('team.auth.invitationsRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('team.auth.invitationsDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('team.auth.loginButton')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{t('team.invitations.listTitle')}</CardTitle>
                  <CardDescription>{t('team.invitations.listDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">{invitation.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('team.invitations.role', { role: getRoleDisplayName(invitation.role) })} • {t('team.invitations.sentDate', { date: formatDate(invitation.createdAt) })}
                          </div>
                          {invitation.message && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {t('team.invitations.message', { message: invitation.message })}
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
                                {t('team.invitations.resendButton')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                {t('team.invitations.cancelButton')}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {invitations.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('team.invitations.noInvitations')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('team.activity.title')}</h2>
              <Input
                placeholder={t('team.activity.searchPlaceholder')}
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
                  <p className="text-lg font-medium text-muted-foreground mb-2">{t('team.auth.activityRequired')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('team.auth.activityDescription')}</p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground">
                      <User className="mr-2 h-4 w-4" />
                      {t('team.auth.loginButton')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('team.activity.listTitle')}
                  </CardTitle>
                  <CardDescription>{t('team.activity.listDescription')}</CardDescription>
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
                              {activity.user?.fullName || t('team.activity.system')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getActivityActionDisplayName(activity.action)}
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
                        {t('team.activity.noActivity')}
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