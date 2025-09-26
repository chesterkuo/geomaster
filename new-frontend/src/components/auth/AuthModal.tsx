import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';
import { authService, LoginRequest, RegisterRequest } from '@/lib/api/auth';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/hooks/use-language';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login', onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, register } = useAuth();
  const { t } = useLanguage();

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    email: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterRequest & { confirmPassword: string }>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login(loginForm.email, loginForm.password);
      
      if (response.success) {
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.welcomeBack'),
        });
        // Force page refresh to update state
        window.location.reload();
      } else {
        toast({
          title: t('auth.loginFailed'),
          description: response.message || t('auth.checkYourCredentials'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.loginError'),
        description: error.response?.data?.message || t('auth.errorOccurredDuringLogin'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate password match
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: t('auth.passwordMismatch'),
        description: t('auth.passwordMismatch'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (registerForm.password.length < 6) {
      toast({
        title: t('auth.passwordFormatError'),
        description: t('auth.passwordTooShort6Chars'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!passwordRegex.test(registerForm.password)) {
      toast({
        title: t('auth.passwordFormatError'),
        description: t('auth.mustContainUppercaseLowercaseNumber'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...requestData } = registerForm;
      const response = await register(requestData);
      
      if (response.success) {
        toast({
          title: t('auth.registerSuccess'),
          description: t('auth.welcomeToGeoMaster'),
        });
        // Force page refresh to update state
        window.location.reload();
      } else {
        toast({
          title: t('auth.registrationFailed'),
          description: response.message || t('auth.errorOccurredDuringRegistration'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.registrationError'),
        description: error.response?.data?.message || t('auth.errorOccurredDuringRegistration'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ fullName: '', email: '', password: '', confirmPassword: '', company: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {activeTab === 'login' ? t('auth.loginAccount') : t('auth.registerAccount')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
            <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.loginToYourAccount')}</CardTitle>
                <CardDescription>
                  {t('auth.enterLoginInfoForFullAccess')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.enterPassword')}
                        className="pl-10 pr-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.loginButton')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.createNewAccount')}</CardTitle>
                <CardDescription>
                  {t('auth.registerToUnlockGeoFeatures')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">{t('auth.name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder={t('auth.enterYourName')}
                        className="pl-10"
                        value={registerForm.fullName}
                        onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-company">{t('auth.companyOptional')}</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-company"
                        type="text"
                        placeholder={t('auth.yourCompanyName')}
                        className="pl-10"
                        value={registerForm.company}
                        onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.enterPassword')}
                        className="pl-10 pr-10"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{t('auth.passwordRequirements')}</p>
                      <ul className="ml-2 space-y-0.5">
                        <li>• {t('auth.atLeastOneLowercase')}</li>
                        <li>• {t('auth.atLeastOneUppercase')}</li>
                        <li>• {t('auth.atLeastOneNumber')}</li>
                        <li>• {t('auth.minimumSixCharacters')}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('auth.enterPasswordAgain')}
                        className="pl-10 pr-10"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.registerAccountButton')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}