import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/hooks/use-language";

export const I18nDemo = () => {
  const { t } = useTranslation();
  const { currentLanguage, supportedLanguages } = useLanguage();

  return (
    <Card className="max-w-2xl mx-auto m-6">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-between">
          {t("nav.main.title")}
          <LanguageSwitcher />
        </CardTitle>
        <CardDescription>
          Current Language: <Badge variant="secondary">{currentLanguage.name}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
              {t("nav.main.title")}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>{t("nav.main.tracking")}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>{t("nav.main.dashboard")}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>{t("nav.main.optimization")}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>{t("nav.main.aiSearch")}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
              {t("nav.analytics.title")}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                <span>{t("nav.analytics.analytics")}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                <span>{t("nav.analytics.research")}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                <span>{t("nav.analytics.reporting")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            {t("common.actions")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{t("common.save")}</Badge>
            <Badge variant="outline">{t("common.cancel")}</Badge>
            <Badge variant="outline">{t("common.edit")}</Badge>
            <Badge variant="outline">{t("common.delete")}</Badge>
            <Badge variant="outline">{t("common.export")}</Badge>
            <Badge variant="outline">{t("common.refresh")}</Badge>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Supported Languages ({supportedLanguages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {supportedLanguages.map((lang) => (
              <div key={lang.code} className={`text-center p-3 rounded-lg border transition-colors ${
                currentLanguage.code === lang.code ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}>
                <div className="text-2xl mb-2">{lang.flag}</div>
                <div className="text-sm font-medium mb-1">{lang.name}</div>
                <div className="text-xs text-muted-foreground">{lang.code}</div>
                {currentLanguage.code === lang.code && (
                  <div className="text-xs text-primary mt-1 font-medium">
                    {t("common.active") || "Active"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            {t("settings.tabs.profile")} & {t("auth.login")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("auth.login")} / {t("auth.logout")}</div>
              <div className="flex space-x-2">
                <Badge variant="secondary">{t("auth.login")}</Badge>
                <Badge variant="outline">{t("auth.logout")}</Badge>
                <Badge variant="outline">{t("auth.register")}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("settings.title")}</div>
              <div className="flex space-x-2">
                <Badge variant="secondary">{t("settings.tabs.profile")}</Badge>
                <Badge variant="outline">{t("settings.tabs.security")}</Badge>
                <Badge variant="outline">{t("settings.tabs.appearance")}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};