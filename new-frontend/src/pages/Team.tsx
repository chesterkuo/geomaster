import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Shield, Settings, Mail, Calendar } from "lucide-react";

const Team = () => {
  const teamMembers = [
    {
      id: 1,
      name: "張小明",
      email: "zhang@company.com",
      role: "管理員",
      status: "活躍",
      lastLogin: "2024-01-15",
      avatar: ""
    },
    {
      id: 2,
      name: "李小華",
      email: "li@company.com",
      role: "編輯者",
      status: "活躍",
      lastLogin: "2024-01-14",
      avatar: ""
    },
    {
      id: 3,
      name: "王小美",
      email: "wang@company.com",
      role: "檢視者",
      status: "離線",
      lastLogin: "2024-01-10",
      avatar: ""
    },
    {
      id: 4,
      name: "陳小強",
      email: "chen@company.com",
      role: "編輯者",
      status: "活躍",
      lastLogin: "2024-01-15",
      avatar: ""
    }
  ];

  const roles = [
    {
      name: "管理員",
      description: "完整系統存取權限，可管理所有功能和用戶",
      permissions: ["完整存取", "用戶管理", "系統設定", "報告匯出"]
    },
    {
      name: "編輯者",
      description: "可編輯內容和查看報告，但無法管理用戶",
      permissions: ["內容編輯", "報告查看", "數據分析", "關鍵字管理"]
    },
    {
      name: "檢視者",
      description: "只能查看報告和數據，無法進行編輯",
      permissions: ["報告查看", "數據查看"]
    }
  ];

  const invitations = [
    {
      email: "new@company.com",
      role: "編輯者",
      status: "待接受",
      sentDate: "2024-01-12"
    },
    {
      email: "user@company.com",
      role: "檢視者",
      status: "已過期",
      sentDate: "2024-01-08"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">團隊管理</h1>
          <p className="text-muted-foreground">管理團隊成員和權限設定</p>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">團隊成員</TabsTrigger>
            <TabsTrigger value="roles">角色權限</TabsTrigger>
            <TabsTrigger value="invitations">邀請管理</TabsTrigger>
            <TabsTrigger value="activity">活動記錄</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">團隊成員 ({teamMembers.length})</h2>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                邀請成員
              </Button>
            </div>

            <div className="grid gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            上次登入: {member.lastLogin}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={member.status === "活躍" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                        <Badge variant="outline">{member.role}</Badge>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">角色與權限</h2>
              <Button variant="outline">自定義角色</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.name}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">權限包含:</h4>
                      <div className="space-y-1">
                        {role.permissions.map((permission, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            • {permission}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">編輯權限</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">邀請管理</h2>
              <Button>發送邀請</Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>待處理邀請</CardTitle>
                <CardDescription>管理發送給新成員的邀請</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitations.map((invitation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-muted-foreground">
                          角色: {invitation.role} • 發送日期: {invitation.sentDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={invitation.status === "待接受" ? "default" : "destructive"}>
                          {invitation.status}
                        </Badge>
                        <Button size="sm" variant="outline">重新發送</Button>
                        <Button size="sm" variant="outline">取消</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  團隊活動記錄
                </CardTitle>
                <CardDescription>查看團隊成員的操作記錄</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">活動記錄</h3>
                  <p className="text-muted-foreground mb-4">這裡將顯示團隊成員的操作記錄和活動日誌</p>
                  <Button variant="outline">查看詳細記錄</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Team;