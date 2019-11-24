//
//  ViewController.swift
//  app

//  Copyright © 2019 eGeoffrey. All rights reserved.
//

import UIKit
import WebKit
import UserNotifications



class ViewController: UITableViewController, WKScriptMessageHandler {
    /* UI widgets */
    @IBOutlet var browser: WKWebView!
    @IBOutlet var menu: UIBarButtonItem!
    var isForeground: Bool = false
    var notificationCounter: Int = 0
    
    /* what to do when the app starts*/
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // setup the Javacript interface for the webview
        let contentController = WKUserContentController()
        contentController.add(self, name: "notify")
        contentController.add(self, name: "print")
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        browser.autoresizingMask = UIView.AutoresizingMask.flexibleWidth
        
        // create the webview
        self.browser = WKWebView( frame: self.view.bounds, configuration: config)
        self.view = self.browser
        
       // load the web page from local resources
        if let url = Bundle.main.url(forResource: "html/index", withExtension: "html") {
            browser.load(URLRequest(url: url))
            browser.allowsBackForwardNavigationGestures = true
        }
        
        // request the user permissions to send notifications
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) {
             (granted, error) in
         }
        
        // keep track when the app runs in foreground/background by registering observers
        NotificationCenter.default.addObserver(self, selector: #selector(enterBackground), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(enterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(enterActive), name: UIApplication.didBecomeActiveNotification, object: nil)
        enterForeground(nil)
    }
    
    /* set foreground status into the html page using the Javascript interface */
    @objc func setForeground(_ foreground: Bool) {
        isForeground = foreground
        browser?.evaluateJavaScript("window.EGEOFFREY_IN_FOREGROUND="+String(foreground), completionHandler: nil)
    }
    
    /* app is in background */
    @objc func enterBackground(_ notification: Notification) {
        setForeground(false)
    }
    
    /* app is in foreground */
    @objc func enterForeground(_ notification: Notification?) {
        setForeground(true)
    }
    
    /* app is active */
    @objc func enterActive(_ notification: Notification?) {
        // reset the notification counter
        notificationCounter = 0
        UIApplication.shared.applicationIconBadgeNumber = 0
    }
    
    /* manage webview behavior opening the browser when needed */
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: (WKNavigationActionPolicy) -> Void) {
        //decisionHandler(.allow)
        let url = navigationAction.request.url
        if url?.description.lowercased().range(of: "http://") != nil || url?.description.lowercased().range(of: "https://") != nil {
            decisionHandler(.cancel)
            UIApplication.shared.open(url!)
        } else {
            decisionHandler(.allow)
        }
    }
    
    /* generate a notification */
    func notify(title: String, message: String) {
        let notificationCenter = UNUserNotificationCenter.current()
        // ensure notification permission has been granted
        notificationCenter.getNotificationSettings(completionHandler: { (settings) in
            if settings.authorizationStatus == .authorized {
                // decode HTML
                guard let data = message.data(using: .utf8) else {
                    return
                }
                let options: [NSAttributedString.DocumentReadingOptionKey: Any] = [
                    .documentType: NSAttributedString.DocumentType.html,
                    .characterEncoding: String.Encoding.utf8.rawValue
                ]
                guard let attributedString = try? NSAttributedString(data: data, options: options, documentAttributes: nil) else {
                    return
                }
                let message = attributedString.string
                // create notification
                let content = UNMutableNotificationContent()
                self.notificationCounter = self.notificationCounter+1
                content.title = title.prefix(1).capitalized + title.dropFirst()
                content.body = message
                content.sound = UNNotificationSound.default
                content.badge = self.notificationCounter as NSNumber
                // notify immediately
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
                let request = UNNotificationRequest(identifier: "notification.id.01", content: content, trigger: trigger)
                UNUserNotificationCenter.current().add(request) { error in
                    guard error == nil else { return }
                }
            }
        })
    }
    
    /* provide javascript interface to the web app can communicate with this nativa app */
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        /* notify user */
        if (message.name == "notify") {
            if let message = message.body as? Array<String> {
//                if (isForeground) {
                self.notify(title: message[0], message: message[2])
//                }
            }
        }
        /* print debug message */
        if message.name == "print", let messageBody = message.body as? String {
            print(messageBody)
        }
    }
    
    /* generate an alert with a text message */
    func alert(title: String, message: String) {
        let alertController = UIAlertController(title: title, message: message, preferredStyle: .alert)
        let OKAction = UIAlertAction(title: "OK", style: .default)
        alertController.addAction(OKAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
    /* handle the menu when clicked on the icon */
    @IBAction func openMenu(_ sender: Any) {
        let optionMenu = UIAlertController(title: nil, message: "Menu", preferredStyle: .actionSheet)
        let gettingStarted = UIAlertAction(title: "Getting Started", style: .default, handler:{ (UIAlertAction) in
            self.alert(title: "Getting Started", message: """
            To fully enjoy a mobile experience with eGeoffrey, you would need:\n
            1) an eGeoffrey instance installed and running somewhere;
            2) the eGeoffrey gateway reachable from the network this device is connected to;
            3) valid credentials set up for your house on the gateway;
            4) the package 'egeoffrey-notification-mobile' installed in your eGeoffrey instance to receive notifications even when this app is in background;
            5) the 'notification/mobile' module configured with the device token you can get from the 'About' menu item of this app;\n
            Please visit https://www.egeoffrey.com for more information.
            """)
        })
        let about = UIAlertAction(title: "About", style: .default, handler:{ (UIAlertAction) in
            let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
            self.alert(title: "About", message: "eGeoffrey App v"+version!)
        })
        let close = UIAlertAction(title: "Close", style: .cancel)
        optionMenu.addAction(gettingStarted)
        optionMenu.addAction(about)
        optionMenu.addAction(close)
        self.present(optionMenu, animated: true, completion: nil)
    }
}

